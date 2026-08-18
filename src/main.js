import * as THREE from 'three';
import './styles/nord-theme.css';

import { Environment } from './scene/Environment.js';
import { MissileModel } from './scene/MissileModel.js';
import { TargetModel } from './scene/TargetModel.js';
import { CameraManager } from './scene/CameraManager.js';
import { TrajectoryManager } from './scene/TrajectoryManager.js';

import { Missile } from './physics/Missile.js';
import { Target } from './physics/Target.js';
import { PNController } from './physics/PNController.js';

import { TelemetryPanel } from './ui/TelemetryPanel.js';
import { Controls } from './ui/Controls.js';
import { MathModal } from './ui/MathModal.js';
import { PathListPanel } from './ui/PathListPanel.js';

/* ─── WebGL Setup ─────────────────────────────────────────────────── */
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 5000);

/* ─── Modules Initialization ───────────────────────────────────────── */
const environment = new Environment(scene);
const cameraManager = new CameraManager(camera, renderer.domElement);
const trajectoryManager = new TrajectoryManager(scene);

const missilePhysics = new Missile({ initialPosition: new THREE.Vector3(0.7, 31.9, -0.45), speed: 400 });
const targetPhysics = new Target({ pattern: 'coastal-crossing' });
const pnController = new PNController({ N: 4.0, maxAccelG: 30.0 });

const missileModel = new MissileModel(scene);
const targetModel = new TargetModel(scene);

const telemetryPanel = new TelemetryPanel();
const mathModal = new MathModal();
const pathListPanel = new PathListPanel({
  onToggleVisibility: (id) => {
    trajectoryManager.toggleVisibility(id);
    pathListPanel.render(trajectoryManager.getTrajectories());
  },
  onDelete: (id) => {
    trajectoryManager.removeTrajectory(id);
    pathListPanel.render(trajectoryManager.getTrajectories());
  },
  onClearAll: () => {
    trajectoryManager.clearAll();
    pathListPanel.render(trajectoryManager.getTrajectories());
  }
});

/* ─── State ───────────────────────────────────────────────────────── */
let isPaused = false;
let stepRequested = false;

/* ─── Controls Callback Handler ────────────────────────────────────── */
const controls = new Controls({
  onLaunch: () => {
    if (missilePhysics.isLaunched) return;

    // Check LOBL launch constraint
    const currentTelemetry = pnController.calculateGuidance(
      missilePhysics.position,
      missilePhysics.velocity,
      targetPhysics.position,
      targetPhysics.velocity
    );

    if (currentTelemetry.loblEnabled && !currentTelemetry.inSeekerFOV) {
      telemetryPanel.flashWarning('LOBL INHIBITED (NO LOCK)');
      return;
    }

    missilePhysics.launch();
  },
  onTogglePause: () => {
    isPaused = !isPaused;
    return isPaused;
  },
  onStepOnce: () => {
    isPaused = true;
    stepRequested = true;
  },
  onReset: () => {
    missilePhysics.reset(new THREE.Vector3(0.7, 31.9, -0.45));
    targetPhysics.reset();
    missileModel.explosionTriggered = false;
    cameraManager.resetOrbit();
    isPaused = false;
  },
  onSavePath: () => {
    if (!missilePhysics.trail || missilePhysics.trail.length < 2) {
      telemetryPanel.flashWarning('NO FLIGHT PATH TO SAVE');
      return;
    }

    const meta = {
      flightTime: missilePhysics.flightTime,
      isHit: missilePhysics.isHit,
      isMissed: missilePhysics.isMissed,
      navGain: pnController.N,
      missileSpeed: missilePhysics.speed,
      targetPattern: targetPhysics.pattern
    };

    const saved = trajectoryManager.addTrajectory(missilePhysics.trail, meta);
    if (saved) {
      pathListPanel.render(trajectoryManager.getTrajectories());
    }
  },
  onCameraChange: (mode) => {
    cameraManager.setMode(mode);
  },
  onNavGainChange: (val) => {
    pnController.setNavigationGain(val);
  },
  onMissileSpeedChange: (val) => {
    missilePhysics.setSpeed(val);
  },
  onTargetSpeedChange: (val) => {
    targetPhysics.setSpeed(val);
  },
  onGLimitChange: (val) => {
    pnController.setMaxAccelG(val);
  },
  onAeroLimitChange: (enabled) => {
    pnController.setAeroLimitEnabled(enabled);
  },
  onLOBLChange: (enabled) => {
    pnController.setLOBLEnabled(enabled);
  },
  onTargetPatternChange: (pattern) => {
    targetPhysics.setPattern(pattern);
    if (!missilePhysics.isLaunched) {
      targetPhysics.reset();
      missilePhysics.reset(new THREE.Vector3(0.7, 31.9, -0.45));
      const overlays = (typeof controls !== 'undefined' && controls) ? controls.getOverlayConfig() : { showLOS: true, showAccel: false, showVel: false, showTrails: true, showSeekerFOV: false };
      const telemetry = pnController.calculateGuidance(
        missilePhysics.position,
        missilePhysics.velocity,
        targetPhysics.position,
        targetPhysics.velocity
      );
      missileModel.update(missilePhysics, overlays, 0, cameraManager.mode, telemetry, camera);
      targetModel.update(targetPhysics, overlays, 0, camera);
    }
  }
});

// Load saved settings (camera mode, speeds, trajectories, overlays)
controls.loadSettings();

/* ─── Resize Handler ──────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

/* ─── Physics Simulation Step ─────────────────────────────────────── */
function simulateStep(dt) {
  // If missile has already completed engagement (hit or missed), freeze physics update
  if (missilePhysics.isHit || missilePhysics.isMissed) {
    return pnController.calculateGuidance(
      missilePhysics.position,
      missilePhysics.velocity,
      targetPhysics.position,
      targetPhysics.velocity
    );
  }

  // 1. Update Target Position & Velocity
  targetPhysics.update(dt);

  // 2. Calculate PN Guidance Law Command
  const telemetry = pnController.calculateGuidance(
    missilePhysics.position,
    missilePhysics.velocity,
    targetPhysics.position,
    targetPhysics.velocity
  );

  // 3. Update Missile Physics
  missilePhysics.update(dt, telemetry.appliedAccel, targetPhysics.position);

  // Handle Hit or Miss outcomes
  if (missilePhysics.isHit) {
    targetPhysics.isHit = true;
    if (!missileModel.explosionTriggered) {
      missileModel.triggerExplosion(targetPhysics.position);
      missileModel.explosionTriggered = true;
    }
  } else if (missilePhysics.isMissed) {
    targetPhysics.isMissed = true;
  }

  // Return calculation for UI & visualization update
  return telemetry;
}

/* ─── Main Animation Loop ─────────────────────────────────────────── */
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  let telemetry;

  if (!isPaused || stepRequested) {
    const dt = 1 / 60; // fixed physics step
    telemetry = simulateStep(dt);
    stepRequested = false;
  } else {
    // When paused, re-evaluate static guidance telemetry for UI observation
    telemetry = pnController.calculateGuidance(
      missilePhysics.position,
      missilePhysics.velocity,
      targetPhysics.position,
      targetPhysics.velocity
    );
  }

  // Update camera perspective
  cameraManager.update(missilePhysics, targetPhysics, delta);

  // Update 3D visual models, environment, overlays, and historical trajectories
  const overlays = controls.getOverlayConfig();
  environment.update(delta);
  missileModel.update(missilePhysics, overlays, delta, cameraManager.mode, telemetry, camera);
  missileModel.updateLOS(missilePhysics.position, targetPhysics.position, overlays.showLOS);
  targetModel.update(targetPhysics, overlays, delta, camera);
  trajectoryManager.update(camera);
  missileModel.updateExplosion(delta);

  // Update Telemetry Panel HUD & Controls State
  telemetryPanel.update(missilePhysics, targetPhysics, telemetry);
  controls.updateLaunchButton(missilePhysics.isLaunched, telemetry);

  // Render WebGL Scene
  renderer.render(scene, camera);
}

// Start loop
requestAnimationFrame(animate);
