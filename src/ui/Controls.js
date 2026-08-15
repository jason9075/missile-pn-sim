export class Controls {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.btnLaunch = document.getElementById('btn-launch');
    this.btnPause = document.getElementById('btn-pause');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.cameraSelect = document.getElementById('camera-select');
    this.cameraHint = document.getElementById('camera-hint');
    
    this.btnOpenSidebar = document.getElementById('btn-open-sidebar');
    this.btnCloseSidebar = document.getElementById('btn-close-sidebar');
    this.sidebarPanel = document.getElementById('sidebar-panel');

    // Controls
    this.navGainInput = document.getElementById('nav-gain');
    this.valNavGain = document.getElementById('val-nav-gain');

    this.missileSpeedInput = document.getElementById('missile-speed');
    this.valMissileSpeed = document.getElementById('val-missile-speed');

    this.targetSpeedInput = document.getElementById('target-speed');
    this.valTargetSpeed = document.getElementById('val-target-speed');

    this.targetPatternSelect = document.getElementById('target-pattern');

    // Overlays
    this.toggleLos = document.getElementById('toggle-los');
    this.toggleAccel = document.getElementById('toggle-accel');
    this.toggleVel = document.getElementById('toggle-vel');
    this.toggleTrails = document.getElementById('toggle-trails');
  }

  bindEvents() {
    this.btnLaunch.addEventListener('click', () => {
      if (this.callbacks.onLaunch) this.callbacks.onLaunch();
    });

    this.btnPause.addEventListener('click', () => {
      if (this.callbacks.onTogglePause) {
        const isPaused = this.callbacks.onTogglePause();
        this.btnPause.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
      }
    });

    this.btnStep.addEventListener('click', () => {
      if (this.callbacks.onStepOnce) this.callbacks.onStepOnce();
    });

    this.btnReset.addEventListener('click', () => {
      if (this.callbacks.onReset) this.callbacks.onReset();
      this.btnPause.textContent = '⏸ Pause';
    });

    this.cameraSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (this.cameraHint) {
        this.cameraHint.style.display = (mode === 'free' || mode === 'orbit') ? 'flex' : 'none';
      }
      if (this.callbacks.onCameraChange) this.callbacks.onCameraChange(mode);
    });

    this.btnOpenSidebar.addEventListener('click', () => {
      this.sidebarPanel.classList.toggle('open');
    });

    this.btnCloseSidebar.addEventListener('click', () => {
      this.sidebarPanel.classList.remove('open');
    });

    // Sliders
    this.navGainInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valNavGain.textContent = val.toFixed(1);
      if (this.callbacks.onNavGainChange) this.callbacks.onNavGainChange(val);
    });

    this.missileSpeedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valMissileSpeed.textContent = val;
      if (this.callbacks.onMissileSpeedChange) this.callbacks.onMissileSpeedChange(val);
    });

    this.targetSpeedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valTargetSpeed.textContent = val;
      if (this.callbacks.onTargetSpeedChange) this.callbacks.onTargetSpeedChange(val);
    });

    this.targetPatternSelect.addEventListener('change', (e) => {
      if (this.callbacks.onTargetPatternChange) this.callbacks.onTargetPatternChange(e.target.value);
    });
  }

  getOverlayConfig() {
    return {
      showLOS: this.toggleLos.checked,
      showAccel: this.toggleAccel.checked,
      showVel: this.toggleVel.checked,
      showTrails: this.toggleTrails.checked
    };
  }
}
