import * as THREE from 'three';
import { LAUNCH_AZIMUTH } from './Missile.js';

/**
 * Builds a pure 90° beam-crossing track, optionally spawning upstream of it.
 *
 * `beamPoint` is where the track passes closest to the launcher, so the heading
 * there — perpendicular to the line of sight at bearing psi = atan2(x, -z) — is
 * the classic beam geometry. Placing that point on the launch bearing (see
 * BEAM_CROSSING_TRACK below) makes the track perpendicular to the fixed rail as
 * well, so it reads as a clean right-angle crossing when viewed from above.
 *
 * Spawning the target *on* that point opens the engagement already at closest
 * approach; `spawnOffset` backs it up along the heading instead, so the run
 * begins while the threat is still closing. Only the spawn moves — the heading
 * is fixed by the beam point, so the right angle to the rail is preserved.
 *
 * To think in aspect angle rather than metres: offset = d / tan(aspect), where
 * d is the beam range. 0 m is a 90° aspect, d/tan(60°) a 60° aspect, and so on.
 *
 * @param {THREE.Vector3} beamPoint - closest approach point of the track
 * @param {number} spawnOffset - metres upstream of the beam point (0 = spawn on it)
 * @param {number} [side=1] - +1 or -1 to pick which way it crosses
 * @returns {{initialPosition: THREE.Vector3, direction: THREE.Vector3}}
 */
function beamCrossingTrack(beamPoint, spawnOffset, side = 1) {
  const psi = Math.atan2(beamPoint.x, -beamPoint.z);
  const direction = new THREE.Vector3(
    side * Math.cos(psi),
    0,
    side * Math.sin(psi)
  ).normalize();

  const initialPosition = beamPoint.clone().addScaledVector(direction, -spawnOffset);

  return { initialPosition, direction };
}

/* Beam point sits on the fixed launch bearing, so the track crosses the rail at
 * a true right angle in plan view. Derived from LAUNCH_AZIMUTH rather than
 * hardcoded — move the rail and the corridor follows it. */
const BEAM_CROSSING_RANGE = 1575; // m, horizontal distance at closest approach
const BEAM_CROSSING_ALTITUDE = 560; // m
const BEAM_CROSSING_SPAWN_OFFSET = 600; // m upstream, giving a run-in to the beam point

const BEAM_CROSSING_TRACK = beamCrossingTrack(
  new THREE.Vector3(
    BEAM_CROSSING_RANGE * Math.sin(LAUNCH_AZIMUTH),
    BEAM_CROSSING_ALTITUDE,
    -BEAM_CROSSING_RANGE * Math.cos(LAUNCH_AZIMUTH)
  ),
  BEAM_CROSSING_SPAWN_OFFSET,
  -1
);

export const TARGET_ROUTES = {
  'coastal-crossing': {
    name: 'Coastline Crossing',
    initialPosition: new THREE.Vector3(950, 480, 1200),
    direction: new THREE.Vector3(-0.1, 0.02, -0.99).normalize(),
    speed: 180
  },
  'direct-inbound': {
    name: 'Direct Inbound',
    initialPosition: new THREE.Vector3(2400, 650, -1400),
    direction: new THREE.Vector3(-0.84, -0.04, 0.54).normalize(),
    speed: 180
  },
  'beam-crossing': {
    name: 'Beam Crossing (90°)',
    initialPosition: BEAM_CROSSING_TRACK.initialPosition,
    direction: BEAM_CROSSING_TRACK.direction,
    speed: 180
  }
};

export class Target {
  constructor(options = {}) {
    this.pattern = options.pattern || 'coastal-crossing';
    const config = TARGET_ROUTES[this.pattern] || TARGET_ROUTES['coastal-crossing'];

    this.initialPosition = options.initialPosition || config.initialPosition.clone();
    this.speed = options.speed !== undefined ? options.speed : config.speed;
    this.direction = config.direction.clone();
    
    this.position = this.initialPosition.clone();
    this.velocity = new THREE.Vector3();
    this.trail = [];
    this.maxTrailLength = 700;
    this.time = 0;
    this.isHit = false;

    this.reset();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.updateVelocity(0);
  }

  setPattern(pattern) {
    this.pattern = pattern;
    const config = TARGET_ROUTES[pattern] || TARGET_ROUTES['coastal-crossing'];
    this.initialPosition.copy(config.initialPosition);
    this.direction.copy(config.direction);
    this.reset();
  }

  // Alias
  setRoute(routeKey) {
    this.setPattern(routeKey);
  }

  reset(initialPos = null) {
    if (initialPos) {
      this.initialPosition.copy(initialPos);
    }
    this.position.copy(this.initialPosition);
    this.trail = [this.position.clone()];
    this.time = 0;
    this.isHit = false;
    this.updateVelocity(0);
  }

  updateVelocity(dt) {
    this.time += dt;
    // Predetermined stable straight flight path towards target airspace
    this.velocity.copy(this.direction).multiplyScalar(this.speed);
  }

  update(dt) {
    // If target has been intercepted and destroyed, freeze position in the air
    if (this.isHit) return;

    this.updateVelocity(dt);
    this.position.addScaledVector(this.velocity, dt);

    // Record trail
    this.trail.push(this.position.clone());
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
}
