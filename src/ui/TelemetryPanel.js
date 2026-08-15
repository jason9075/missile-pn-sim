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
    this.elAppliedAccel = document.getElementById('tel-applied-accel');
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

    const appMs2 = telemetry.appliedAccelMag.toFixed(1);
    this.elAppliedAccel.textContent = `${appMs2} m/s²`;
  }
}
