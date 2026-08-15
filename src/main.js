import * as THREE from 'three';
import './styles/nord-theme.css';

import { Environment } from './scene/Environment.js';
import { MissileModel } from './scene/MissileModel.js';
import { TargetModel } from './scene/TargetModel.js';
import { CameraManager } from './scene/CameraManager.js';

import { Missile } from './physics/Missile.js';
import { Target } from './physics/Target.js';
import { PNController } from './physics/PNController.js';

import { TelemetryPanel } from './ui/TelemetryPanel.js';
import { Controls } from './ui/Controls.js';
import { MathModal } from './ui/MathModal.js';

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

const missilePhysics = new Missile({ initialPosition: new THREE.Vector3(0.7, 31.9, -0.45), speed: 400 });
const targetPhysics = new Target({ initialPosition: new THREE.Vector3(2400, 650, -1400), speed: 180, pattern: 'straight' });
const pnController = new PNController({ N: 4.0, maxAccelG: 30.0 });

const missileModel = new MissileModel(scene);
const targetModel = new TargetModel(scene);

const telemetryPanel = new TelemetryPanel();
const mathModal = new MathModal();

/* ─── State ───────────────────────────────────────────────────────── */
let isPaused = false;
let stepRequested = false;

/* ─── Controls Callback Handler ────────────────────────────────────── */
const controls = new Controls({
  onLaunch: () => {
    if (!missilePhysics.isLaunched) {
      missilePhysics.launch();
    }
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
    targetPhysics.reset(new THREE.Vector3(2400, 650, -1400));
    missileModel.explosionTriggered = false;
    cameraManager.resetOrbit();
    isPaused = false;
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
  onTargetPatternChange: (pattern) => {
    targetPhysics.setPattern(pattern);
  }
});

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
  // 1. Update Target Position & Velocity (if not intercepted)
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

  // Trigger explosion & target destruction on hit
  if (missilePhysics.isHit) {
    targetPhysics.isHit = true;
    if (!missileModel.explosionTriggered) {
      missileModel.triggerExplosion(targetPhysics.position);
      missileModel.explosionTriggered = true;
    }
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

  // Update 3D visual models, environment, and overlays
  const overlays = controls.getOverlayConfig();
  environment.update(delta);
  missileModel.update(missilePhysics, targetPhysics, overlays);
  targetModel.update(targetPhysics, overlays, delta);
  missileModel.updateExplosion(delta);

  // Update camera perspective
  cameraManager.update(missilePhysics, targetPhysics, delta);

  // Update Telemetry Panel HUD
  telemetryPanel.update(missilePhysics, targetPhysics, telemetry);

  // Render WebGL Scene
  renderer.render(scene, camera);
}

// Start loop
requestAnimationFrame(animate);
