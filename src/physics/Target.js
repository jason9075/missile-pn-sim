import * as THREE from 'three';

export class Target {
  constructor(options = {}) {
    this.initialPosition = options.initialPosition || new THREE.Vector3(2400, 650, -1400);
    this.speed = options.speed !== undefined ? options.speed : 180; // m/s
    this.pattern = options.pattern || 'straight'; // 'straight', 'sinusoidal', 'circular'
    
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
  }

  setPattern(pattern) {
    this.pattern = pattern;
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
    const t = this.time;
    const v = this.speed;

    if (this.pattern === 'straight') {
      // Inbound cruise across the strait towards the coast/airspace
      const dir = new THREE.Vector3(-0.84, -0.04, 0.54).normalize();
      this.velocity.copy(dir.multiplyScalar(v));
    } else if (this.pattern === 'sinusoidal') {
      // Base inbound direction with lateral snake/weave evasion
      const baseDir = new THREE.Vector3(-0.84, -0.04, 0.54).normalize();
      const weaveAxis = new THREE.Vector3(0.54, 0, 0.84).normalize();
      const freq = 0.7; // Hz
      const amplitude = 0.55; 
      
      const lateralVel = weaveAxis.clone().multiplyScalar(Math.cos(freq * t) * v * amplitude);
      const mainVel = baseDir.clone().multiplyScalar(v * Math.sqrt(1 - amplitude * amplitude * 0.25));
      this.velocity.copy(mainVel.add(lateralVel)).normalize().multiplyScalar(v);
    } else if (this.pattern === 'circular') {
      // High-G evasive turn
      const turnRate = 0.35; // rad/s
      const angle = turnRate * t;
      const vx = -Math.sin(angle) * v * 0.9;
      const vz = -Math.cos(angle) * v * 0.9;
      const vy = Math.sin(t * 0.3) * (v * 0.2);
      this.velocity.set(vx, vy, vz);
    }
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
