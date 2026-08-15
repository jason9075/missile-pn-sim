import * as THREE from 'three';

export class VectorMath {
  /**
   * Computes closing velocity Vc = - dR/dt = - (r . vr) / R
   * @param {THREE.Vector3} losVector - r = r_t - r_m
   * @param {THREE.Vector3} relVel - vr = v_t - v_m
   * @returns {number} Vc in m/s
   */
  static computeClosingVelocity(losVector, relVel) {
    const range = losVector.length();
    if (range < 1e-5) return 0;
    return -losVector.dot(relVel) / range;
  }

  /**
   * Computes LOS Angular Velocity Vector omega_los = (r x vr) / R^2
   * @param {THREE.Vector3} losVector - r = r_t - r_m
   * @param {THREE.Vector3} relVel - vr = v_t - v_m
   * @returns {THREE.Vector3} omega_los in rad/s
   */
  static computeLOSRate(losVector, relVel) {
    const rangeSq = losVector.lengthSq();
    if (rangeSq < 1e-8) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3().crossVectors(losVector, relVel).divideScalar(rangeSq);
  }

  /**
   * Computes True Proportional Navigation (TPN) Guidance Acceleration Command
   * a_c = N * Vc * (omega_los x u_m)
   * @param {number} N - Navigation Constant / Gain (e.g., 3.0 to 5.0)
   * @param {number} Vc - Closing velocity
   * @param {THREE.Vector3} omegaLos - LOS rate vector
   * @param {THREE.Vector3} missileVel - Missile velocity vector
   * @returns {THREE.Vector3} Acceleration command vector (m/s^2)
   */
  static computeTPNAccelCommand(N, Vc, omegaLos, missileVel) {
    const speed = missileVel.length();
    if (speed < 1e-5 || Vc <= 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    const u_m = missileVel.clone().normalize();
    const perpComponent = new THREE.Vector3().crossVectors(omegaLos, u_m);
    return perpComponent.multiplyScalar(N * Vc);
  }

  /**
   * Calculates Azimuth and Elevation of a vector in degrees
   * @param {THREE.Vector3} vec 
   * @returns {{azimuth: number, elevation: number}}
   */
  static getAzimuthElevation(vec) {
    const len = vec.length();
    if (len < 1e-5) return { azimuth: 0, elevation: 0 };
    const az = Math.atan2(vec.x, vec.z) * (180 / Math.PI);
    const el = Math.asin(Math.max(-1, Math.min(1, vec.y / len))) * (180 / Math.PI);
    return { azimuth: az, elevation: el };
  }
}
