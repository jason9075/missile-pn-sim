import * as THREE from 'three';
import { VectorMath } from './VectorMath.js';

export class PNController {
  constructor(options = {}) {
    this.N = options.N !== undefined ? options.N : 4.0;
    this.maxAccelG = options.maxAccelG !== undefined ? options.maxAccelG : 30.0; // max G limits
  }

  setNavigationGain(N) {
    this.N = N;
  }

  /**
   * Calculates the guidance command and outputs telemetry data
   * @param {THREE.Vector3} missilePos 
   * @param {THREE.Vector3} missileVel 
   * @param {THREE.Vector3} targetPos 
   * @param {THREE.Vector3} targetVel 
   * @returns {Object} Guidance result & telemetry
   */
  calculateGuidance(missilePos, missileVel, targetPos, targetVel) {
    // 1. LOS Vector: r = r_t - r_m
    const losVector = new THREE.Vector3().subVectors(targetPos, missilePos);
    const range = losVector.length();
    const u_los = losVector.clone().normalize();

    // 2. Relative Velocity: vr = v_t - v_m
    const relVel = new THREE.Vector3().subVectors(targetVel, missileVel);

    // 3. Closing Velocity: Vc = - (r . vr) / R
    const Vc = VectorMath.computeClosingVelocity(losVector, relVel);

    // 4. LOS Rate vector: omega_los = (r x vr) / R^2
    const omegaLos = VectorMath.computeLOSRate(losVector, relVel);
    const losRateMagnitude = omegaLos.length();

    // 5. Raw Acceleration Command (a_c)
    const cmdAccel = VectorMath.computeTPNAccelCommand(this.N, Vc, omegaLos, missileVel);
    const cmdAccelMag = cmdAccel.length();
    const cmdAccelG = cmdAccelMag / 9.81;

    // 6. Apply physical saturation limit (a_m)
    const maxAccelMs2 = this.maxAccelG * 9.81;
    const appliedAccel = cmdAccel.clone();
    if (cmdAccelMag > maxAccelMs2) {
      appliedAccel.clampLength(0, maxAccelMs2);
    }
    const appliedAccelMag = appliedAccel.length();

    // 7. LOS Angles
    const angles = VectorMath.getAzimuthElevation(losVector);

    return {
      losVector,
      u_los,
      relVel,
      range,
      Vc,
      omegaLos,
      losRateMagnitude,
      cmdAccel,
      cmdAccelMag,
      cmdAccelG,
      appliedAccel,
      appliedAccelMag,
      losAzimuth: angles.azimuth,
      losElevation: angles.elevation
    };
  }
}
