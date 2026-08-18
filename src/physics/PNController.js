import * as THREE from 'three';
import { VectorMath } from './VectorMath.js';

/** Standard gravity (m/s²) — the reference for expressing accelerations in G. */
export const G0 = 9.80665;

/* ISA troposphere density model, valid up to the tropopause (~11 km). */
const SEA_LEVEL_DENSITY = 1.225; // kg/m³
const ISA_LAPSE_COEFF = 2.25577e-5; // 1/m
const ISA_DENSITY_EXP = 4.25588;
const ISA_CEILING = 11000; // m

/**
 * Design flight condition: at sea level and this speed the airframe delivers
 * exactly its structural G limit. Matches the default missile speed so the
 * aero model is a no-op at the factory settings.
 */
const AERO_REF_SPEED = 400; // m/s

/**
 * ISA troposphere air density.
 * @param {number} altitude - metres above sea level
 * @returns {number} density in kg/m³
 */
export function airDensity(altitude) {
  const h = Math.min(Math.max(altitude, 0), ISA_CEILING);
  return SEA_LEVEL_DENSITY * Math.pow(1 - ISA_LAPSE_COEFF * h, ISA_DENSITY_EXP);
}

export class PNController {
  constructor(options = {}) {
    this.N = options.N !== undefined ? options.N : 4.0;
    this.maxAccelG = options.maxAccelG !== undefined ? options.maxAccelG : 30.0; // structural limit
    this.aeroLimitEnabled = options.aeroLimitEnabled === true;
  }

  setNavigationGain(N) {
    this.N = N;
  }

  /** Sets the structural (hard ceiling) load factor in G. */
  setMaxAccelG(maxAccelG) {
    this.maxAccelG = maxAccelG;
  }

  /** Enables the dynamic-pressure dependent aerodynamic G limit. */
  setAeroLimitEnabled(enabled) {
    this.aeroLimitEnabled = enabled;
  }

  /**
   * Effective lateral G limit at the current flight condition.
   *
   * Lateral acceleration comes from aerodynamic lift, so the achievable load
   * factor scales with dynamic pressure q = ½ρV². Referencing the design point
   * (sea level, AERO_REF_SPEED) collapses the usual ½ρV²·S·C_L,max/m into a
   * single ratio, and the structural limit caps it from above:
   *
   *   n_eff = n_struct · min(1, q / q_ref)
   *
   * @param {number} altitude - missile altitude in metres
   * @param {number} speed - missile speed in m/s
   * @returns {number} effective limit in G
   */
  effectiveMaxAccelG(altitude, speed) {
    if (!this.aeroLimitEnabled) return this.maxAccelG;
    const densityRatio = airDensity(altitude) / SEA_LEVEL_DENSITY;
    const qRatio = densityRatio * (speed / AERO_REF_SPEED) ** 2;
    return this.maxAccelG * Math.min(1, qRatio);
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
    const cmdAccelG = cmdAccelMag / G0;

    // Split the command into the rudder (yaw) and elevator (pitch) fin channels
    const cmdAxes = VectorMath.decomposeBodyAxes(cmdAccel, missileVel);

    // 6. Apply the flight-condition dependent saturation limit (a_m)
    const missileSpeed = missileVel.length();
    const u_m = missileSpeed > 1e-5 ? missileVel.clone().normalize() : new THREE.Vector3(0, 0, 0);
    const maxAccelG = this.effectiveMaxAccelG(missilePos.y, missileSpeed);
    const maxAccelMag = maxAccelG * G0;
    const appliedAccel = cmdAccel.clone().clampLength(0, maxAccelMag);
    const appliedAccelMag = appliedAccel.length();
    const isSaturated = cmdAccelMag > maxAccelMag + 1e-6;

    // 7. LOS Angles
    const angles = VectorMath.getAzimuthElevation(losVector);

    return {
      losVector,
      u_los,
      u_m,
      relVel,
      range,
      Vc,
      omegaLos,
      losRateMagnitude,
      cmdAccel,
      cmdAccelMag,
      cmdAccelG,
      cmdAccelYaw: cmdAxes.yaw,
      cmdAccelPitch: cmdAxes.pitch,
      cmdAccelYawG: cmdAxes.yaw / G0,
      cmdAccelPitchG: cmdAxes.pitch / G0,
      appliedAccel,
      appliedAccelMag,
      appliedAccelG: appliedAccelMag / G0,
      maxAccelG,
      maxAccelMag,
      structuralMaxAccelG: this.maxAccelG,
      isSaturated,
      dynamicPressure: 0.5 * airDensity(missilePos.y) * missileSpeed ** 2,
      losAzimuth: angles.azimuth,
      losElevation: angles.elevation
    };
  }
}
