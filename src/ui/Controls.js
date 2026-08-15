const STORAGE_KEY = 'missile_pn_sim_settings_v1';

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

    // Controls in Simulation Settings
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

  saveSettings() {
    try {
      const settings = {
        navGain: parseFloat(this.navGainInput.value),
        missileSpeed: parseFloat(this.missileSpeedInput.value),
        targetSpeed: parseFloat(this.targetSpeedInput.value),
        targetPattern: this.targetPatternSelect ? this.targetPatternSelect.value : 'coastal-crossing',
        cameraMode: this.cameraSelect ? this.cameraSelect.value : 'free',
        showLOS: this.toggleLos.checked,
        showAccel: this.toggleAccel.checked,
        showVel: this.toggleVel.checked,
        showTrails: this.toggleTrails.checked
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save settings to localStorage:', err);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      if (!settings || typeof settings !== 'object') return;

      // 1. Navigation Gain
      if (typeof settings.navGain === 'number' && !isNaN(settings.navGain)) {
        this.navGainInput.value = settings.navGain;
        this.valNavGain.textContent = settings.navGain.toFixed(1);
        if (this.callbacks.onNavGainChange) this.callbacks.onNavGainChange(settings.navGain);
      }

      // 2. Missile Speed
      if (typeof settings.missileSpeed === 'number' && !isNaN(settings.missileSpeed)) {
        this.missileSpeedInput.value = settings.missileSpeed;
        this.valMissileSpeed.textContent = settings.missileSpeed;
        if (this.callbacks.onMissileSpeedChange) this.callbacks.onMissileSpeedChange(settings.missileSpeed);
      }

      // 3. Target Speed
      if (typeof settings.targetSpeed === 'number' && !isNaN(settings.targetSpeed)) {
        this.targetSpeedInput.value = settings.targetSpeed;
        this.valTargetSpeed.textContent = settings.targetSpeed;
        if (this.callbacks.onTargetSpeedChange) this.callbacks.onTargetSpeedChange(settings.targetSpeed);
      }

      // 4. Target Flight Corridor / Trajectory Pattern
      if (settings.targetPattern && this.targetPatternSelect) {
        this.targetPatternSelect.value = settings.targetPattern;
        if (this.callbacks.onTargetPatternChange) this.callbacks.onTargetPatternChange(settings.targetPattern);
      }

      // 5. Camera Mode
      if (settings.cameraMode && this.cameraSelect) {
        this.cameraSelect.value = settings.cameraMode;
        if (this.cameraHint) {
          this.cameraHint.style.display = (settings.cameraMode === 'free' || settings.cameraMode === 'orbit') ? 'flex' : 'none';
        }
        if (this.callbacks.onCameraChange) this.callbacks.onCameraChange(settings.cameraMode);
      }

      // 6. Visual Overlays
      if (typeof settings.showLOS === 'boolean') this.toggleLos.checked = settings.showLOS;
      if (typeof settings.showAccel === 'boolean') this.toggleAccel.checked = settings.showAccel;
      if (typeof settings.showVel === 'boolean') this.toggleVel.checked = settings.showVel;
      if (typeof settings.showTrails === 'boolean') this.toggleTrails.checked = settings.showTrails;
    } catch (err) {
      console.warn('Failed to load settings from localStorage:', err);
    }
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

    // Target Trajectory change in Simulation Settings panel
    if (this.targetPatternSelect) {
      this.targetPatternSelect.addEventListener('change', (e) => {
        const pattern = e.target.value;
        this.saveSettings();
        if (this.callbacks.onTargetPatternChange) {
          this.callbacks.onTargetPatternChange(pattern);
        }
      });
    }

    this.cameraSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (this.cameraHint) {
        this.cameraHint.style.display = (mode === 'free' || mode === 'orbit') ? 'flex' : 'none';
      }
      this.saveSettings();
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
      this.saveSettings();
      if (this.callbacks.onNavGainChange) this.callbacks.onNavGainChange(val);
    });

    this.missileSpeedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valMissileSpeed.textContent = val;
      this.saveSettings();
      if (this.callbacks.onMissileSpeedChange) this.callbacks.onMissileSpeedChange(val);
    });

    this.targetSpeedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valTargetSpeed.textContent = val;
      this.saveSettings();
      if (this.callbacks.onTargetSpeedChange) this.callbacks.onTargetSpeedChange(val);
    });

    // Overlay checkboxes
    [this.toggleLos, this.toggleAccel, this.toggleVel, this.toggleTrails].forEach((chk) => {
      if (chk) {
        chk.addEventListener('change', () => {
          this.saveSettings();
        });
      }
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
