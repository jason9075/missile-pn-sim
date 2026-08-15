import * as THREE from 'three';

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
