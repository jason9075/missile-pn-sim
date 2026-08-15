import * as THREE from 'three';

export class Missile {
  constructor(options = {}) {
    this.initialPosition = options.initialPosition || new THREE.Vector3(0, 10, 0);
    this.speed = options.speed !== undefined ? options.speed : 400; // m/s
    this.killRadius = options.killRadius !== undefined ? options.killRadius : 15.0; // 15 meters intercept radius

    this.position = this.initialPosition.clone();
    this.velocity = new THREE.Vector3(0, 300, -200).normalize().multiplyScalar(this.speed);
    this.orientation = new THREE.Quaternion();
    
    this.isLaunched = false;
    this.isHit = false;
    this.isMissed = false;
    this.flightTime = 0;

    this.trail = [];
    this.maxTrailLength = 800;
    this.lastAppliedAccel = new THREE.Vector3(0, 0, 0);
    this.closestDistance = Infinity;

    this.reset();
  }

  setSpeed(speed) {
    this.speed = speed;
    if (!this.isLaunched) {
      this.velocity.normalize().multiplyScalar(this.speed);
    }
  }

  reset(initialPos = null) {
    if (initialPos) {
      this.initialPosition.copy(initialPos);
    }
    this.position.copy(this.initialPosition);
    // Initial launch pitch and azimuth perfectly aligned with launcher turret (58 deg azimuth, 45 deg elevation)
    const launchAzimuth = 1.012; // rad (58 deg)
    const launchPitch = Math.PI / 4; // 45 deg
    const launchDir = new THREE.Vector3(
      Math.sin(launchAzimuth) * Math.cos(launchPitch),
      Math.sin(launchPitch),
      -Math.cos(launchAzimuth) * Math.cos(launchPitch)
    ).normalize();

    this.velocity.copy(launchDir).multiplyScalar(this.speed);
    
    this.isLaunched = false;
    this.isHit = false;
    this.isMissed = false;
    this.flightTime = 0;
    this.trail = [this.position.clone()];
    this.lastAppliedAccel.set(0, 0, 0);
    this.closestDistance = Infinity;

    this.updateOrientation();
  }

  launch() {
    this.isLaunched = true;
  }

  updateOrientation() {
    if (this.velocity.lengthSq() > 1e-5) {
      const dir = this.velocity.clone().normalize();
      // Missile forward axis is -Z in Three.js default mesh coordinates, or +Y if cylinder aligned up.
      // We will assume forward is +Z for local matrix or align quaternion from (0,0,1) or (0,1,0) to dir
      const forward = new THREE.Vector3(0, 0, -1);
      this.orientation.setFromUnitVectors(forward, dir);
    }
  }

  update(dt, appliedAccel, targetPos) {
    if (!this.isLaunched || this.isHit || this.isMissed) return;

    this.flightTime += dt;
    this.lastAppliedAccel.copy(appliedAccel);

    // Update velocity vector by applying transverse acceleration command
    // v_m_new = normalize(v_m + a_m * dt) * speed
    const newVel = this.velocity.clone().addScaledVector(appliedAccel, dt);
    
    // Constant speed constraint or thrust profile
    if (newVel.lengthSq() > 1e-5) {
      newVel.normalize().multiplyScalar(this.speed);
    }
    this.velocity.copy(newVel);

    // Update position
    this.position.addScaledVector(this.velocity, dt);
    this.updateOrientation();

    // Check distance to target
    const currentDist = this.position.distanceTo(targetPos);
    if (currentDist < this.closestDistance) {
      this.closestDistance = currentDist;
    }

    // Intercept hit check
    if (currentDist <= this.killRadius) {
      this.isHit = true;
    } 
    // Miss check: if distance starts increasing after getting close (passed target) and beyond kill radius
    else if (this.flightTime > 1.5 && currentDist > this.closestDistance + 20 && currentDist > this.killRadius) {
      this.isMissed = true;
    }
    // Ground collision or extreme flight time check
    else if (this.position.y < 0 || this.flightTime > 30.0) {
      this.isMissed = true;
    }

    // Record trail point
    this.trail.push(this.position.clone());
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
}
