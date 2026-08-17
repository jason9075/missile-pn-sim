/** Pixel radius of the a_c direction gauge, matching the dashed limit circle. */
const VECTOR_RADIUS = 30;

export class TelemetryPanel {
  constructor() {
    this.elTime = document.getElementById('tel-time');
    this.elRange = document.getElementById('tel-range');
    this.elVc = document.getElementById('tel-vc');
    this.elMissileState = document.getElementById('tel-missile-state');
    this.elTargetState = document.getElementById('tel-target-state');
    this.elLosAngles = document.getElementById('tel-los-angles');
    this.elLosRate = document.getElementById('tel-los-rate');
    this.elCmdAccel = document.getElementById('tel-cmd-accel');
    this.elCmdAxes = document.getElementById('tel-cmd-axes');
    this.elCmdVector = document.getElementById('tel-cmd-vector');
    this.elVecShaft = document.getElementById('tel-vec-shaft');
    this.elVecHead = document.getElementById('tel-vec-head');
    this.elAppliedAccel = document.getElementById('tel-applied-accel');
    this.elGLimit = document.getElementById('tel-g-limit');
    this.elStatus = document.getElementById('hud-status');
  }

  update(missile, target, telemetry) {
    if (!missile.isLaunched) {
      this.elStatus.textContent = 'STANDBY';
      this.elStatus.className = 'hud-badge status-standby';
    } else if (missile.isHit) {
      this.elStatus.textContent = 'TARGET INTERCEPTED (HIT)';
      this.elStatus.className = 'hud-badge status-hit';
    } else if (missile.isMissed) {
      this.elStatus.textContent = 'TARGET MISSED';
      this.elStatus.className = 'hud-badge status-miss';
    } else {
      this.elStatus.textContent = 'INTERCEPTING';
      this.elStatus.className = 'hud-badge status-intercepting';
    }

    this.elTime.textContent = `${missile.flightTime.toFixed(2)} s`;
    this.elRange.textContent = `${Math.round(telemetry.range)} m`;
    this.elVc.textContent = `${Math.round(telemetry.Vc)} m/s`;

    const mSpeed = Math.round(missile.velocity.length());
    const mAlt = Math.round(missile.position.y);
    this.elMissileState.textContent = `${mSpeed} m/s | ${mAlt} m`;

    const tSpeed = Math.round(target.velocity.length());
    const tAlt = Math.round(target.position.y);
    this.elTargetState.textContent = `${tSpeed} m/s | ${tAlt} m`;

    this.elLosAngles.textContent = `${telemetry.losAzimuth.toFixed(1)}° | ${telemetry.losElevation.toFixed(1)}°`;
    this.elLosRate.textContent = `${telemetry.losRateMagnitude.toFixed(4)} rad/s`;

    const cmdG = telemetry.cmdAccelG.toFixed(1);
    const cmdMs2 = telemetry.cmdAccelMag.toFixed(1);
    this.elCmdAccel.textContent = `${cmdMs2} m/s² (${cmdG} G)`;

    // Body-frame channels: sign carries the turn direction, so display it as a letter
    const yawG = telemetry.cmdAccelYawG;
    const pitchG = telemetry.cmdAccelPitchG;
    const yawDir = yawG >= 0 ? 'R' : 'L';
    const pitchDir = pitchG >= 0 ? 'U' : 'D';
    this.elCmdAxes.textContent =
      `${yawDir} ${Math.abs(yawG).toFixed(1)} | ${pitchDir} ${Math.abs(pitchG).toFixed(1)} G`;

    this.updateVectorGauge(yawG, pitchG, telemetry);

    const appMs2 = telemetry.appliedAccelMag.toFixed(1);
    const appG = telemetry.appliedAccelG.toFixed(1);
    this.elAppliedAccel.textContent = `${appMs2} m/s² (${appG} G)`;
    this.elAppliedAccel.classList.toggle('is-saturated', telemetry.isSaturated);

    // Available G erodes with dynamic pressure once the aero limit is enabled
    const isDegraded = telemetry.maxAccelG < telemetry.structuralMaxAccelG - 1e-3;
    this.elGLimit.textContent = isDegraded
      ? `${telemetry.maxAccelG.toFixed(1)} G / ${telemetry.structuralMaxAccelG.toFixed(0)} G`
      : `${telemetry.maxAccelG.toFixed(1)} G`;
    this.elGLimit.classList.toggle('is-degraded', isDegraded);
  }

  /**
   * Draws a_c as a 2D arrow in the missile transverse plane: horizontal is the
   * yaw (rudder) channel, vertical the pitch (elevator) channel. Length is
   * normalised against the current G-limit, so the arrow touching the dashed
   * circle means the command is saturated.
   *
   * @param {number} yawG - yaw channel in G, positive = right
   * @param {number} pitchG - pitch channel in G, positive = up
   * @param {Object} telemetry - guidance telemetry for this frame
   */
  updateVectorGauge(yawG, pitchG, telemetry) {
    const magnitude = Math.hypot(yawG, pitchG);
    const limit = telemetry.maxAccelG;
    const reach = limit > 1e-6 ? Math.min(1, magnitude / limit) : 0;

    // SVG y grows downward, so a positive (upward) pitch command negates it
    const scale = magnitude > 1e-9 ? (reach * VECTOR_RADIUS) / magnitude : 0;
    const tipX = yawG * scale;
    const tipY = -pitchG * scale;

    this.elVecShaft.setAttribute('x2', tipX.toFixed(2));
    this.elVecShaft.setAttribute('y2', tipY.toFixed(2));

    const angle = Math.atan2(tipY, tipX) * (180 / Math.PI);
    this.elVecHead.setAttribute(
      'transform',
      `translate(${tipX.toFixed(2)}, ${tipY.toFixed(2)}) rotate(${angle.toFixed(1)})`
    );
    // Hide the head at near-zero command so no stray triangle sits on the origin
    this.elVecHead.style.opacity = reach > 0.05 ? '1' : '0';

    this.elCmdVector.classList.toggle('is-saturated', telemetry.isSaturated);
  }
}
