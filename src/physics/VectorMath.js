import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_FORWARD = new THREE.Vector3(0, 0, -1);

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
   * Decomposes a transverse acceleration into missile body-frame yaw/pitch channels.
   *
   * For a zero-bank (skid-to-turn) missile the plane normal to the velocity is
   * spanned by a horizontal "right" axis and an "up" axis, which map one-to-one
   * onto the rudder and elevator fin commands:
   *
   *   e_right = u_m x y_world   (positive yaw = turn right)
   *   e_up    = e_right x u_m   (positive pitch = pull up)
   *
   * Since a_c is perpendicular to u_m by construction, the two components fully
   * reconstruct it: |a_c|^2 = a_yaw^2 + a_pitch^2.
   *
   * @param {THREE.Vector3} accel - transverse acceleration vector
   * @param {THREE.Vector3} missileVel - missile velocity vector
   * @returns {{yaw: number, pitch: number}} signed components, same units as accel
   */
  static decomposeBodyAxes(accel, missileVel) {
    const speed = missileVel.length();
    if (speed < 1e-5) return { yaw: 0, pitch: 0 };
    const u_m = missileVel.clone().divideScalar(speed);

    // Near-vertical flight leaves the horizontal reference undefined; swap to the
    // world forward axis so the frame stays well conditioned.
    const right = new THREE.Vector3().crossVectors(u_m, WORLD_UP);
    if (right.lengthSq() < 1e-8) {
      right.crossVectors(u_m, WORLD_FORWARD);
    }
    right.normalize();

    const up = new THREE.Vector3().crossVectors(right, u_m).normalize();
    return { yaw: accel.dot(right), pitch: accel.dot(up) };
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

  /**
   * Computes seeker look angle (off-boresight angle / gimbal angle) eta in degrees
   * eta = arccos(u_m . u_los)
   * @param {THREE.Vector3} missileVel - Missile velocity vector
   * @param {THREE.Vector3} losVector - Line of sight vector (r_t - r_m)
   * @returns {number} Look angle in degrees [0, 180]
   */
  static computeLookAngle(missileVel, losVector) {
    const speed = missileVel.length();
    const range = losVector.length();
    if (speed < 1e-5 || range < 1e-5) return 0;
    const u_m = missileVel.clone().divideScalar(speed);
    const u_los = losVector.clone().divideScalar(range);
    const dot = Math.max(-1, Math.min(1, u_m.dot(u_los)));
    return Math.acos(dot) * (180 / Math.PI);
  }
}

