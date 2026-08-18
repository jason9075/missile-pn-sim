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
    this.btnSavePath = document.getElementById('btn-save-path');
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

    // Airframe & Guidance Limits
    this.gLimitInput = document.getElementById('g-limit');
    this.valGLimit = document.getElementById('val-g-limit');
    this.toggleAeroLimit = document.getElementById('toggle-aero-limit');
    this.toggleLobl = document.getElementById('toggle-lobl');

    // Overlays
    this.toggleLos = document.getElementById('toggle-los');
    this.toggleAccel = document.getElementById('toggle-accel');
    this.toggleVel = document.getElementById('toggle-vel');
    this.toggleTrails = document.getElementById('toggle-trails');
    this.toggleSeekerFov = document.getElementById('toggle-seeker-fov');
  }

  saveSettings() {
    try {
      const settings = {
        navGain: parseFloat(this.navGainInput.value),
        missileSpeed: parseFloat(this.missileSpeedInput.value),
        targetSpeed: parseFloat(this.targetSpeedInput.value),
        targetPattern: this.targetPatternSelect ? this.targetPatternSelect.value : 'coastal-crossing',
        gLimit: parseFloat(this.gLimitInput.value),
        aeroLimit: this.toggleAeroLimit ? this.toggleAeroLimit.checked : false,
        loblMode: this.toggleLobl ? this.toggleLobl.checked : true,
        cameraMode: this.cameraSelect ? this.cameraSelect.value : 'free',
        showLOS: this.toggleLos.checked,
        showAccel: this.toggleAccel.checked,
        showVel: this.toggleVel.checked,
        showTrails: this.toggleTrails.checked,
        showSeekerFOV: this.toggleSeekerFov ? this.toggleSeekerFov.checked : false
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

      // 5. Structural G-Limit
      if (typeof settings.gLimit === 'number' && !isNaN(settings.gLimit)) {
        this.gLimitInput.value = settings.gLimit;
        this.valGLimit.textContent = settings.gLimit;
        if (this.callbacks.onGLimitChange) this.callbacks.onGLimitChange(settings.gLimit);
      }

      // 6. Aerodynamic (q-dependent) G-Limit
      if (typeof settings.aeroLimit === 'boolean' && this.toggleAeroLimit) {
        this.toggleAeroLimit.checked = settings.aeroLimit;
        if (this.callbacks.onAeroLimitChange) this.callbacks.onAeroLimitChange(settings.aeroLimit);
      }

      // 7. LOBL Mode (Lock-On Before Launch)
      if (typeof settings.loblMode === 'boolean' && this.toggleLobl) {
        this.toggleLobl.checked = settings.loblMode;
        if (this.callbacks.onLOBLChange) this.callbacks.onLOBLChange(settings.loblMode);
      }

      // 8. Camera Mode
      if (settings.cameraMode && this.cameraSelect) {
        this.cameraSelect.value = settings.cameraMode;
        if (this.cameraHint) {
          this.cameraHint.style.display = (settings.cameraMode === 'free' || settings.cameraMode === 'orbit') ? 'flex' : 'none';
        }
        if (this.callbacks.onCameraChange) this.callbacks.onCameraChange(settings.cameraMode);
      }

      // 9. Visual Overlays
      if (typeof settings.showLOS === 'boolean') this.toggleLos.checked = settings.showLOS;
      if (typeof settings.showAccel === 'boolean') this.toggleAccel.checked = settings.showAccel;
      if (typeof settings.showVel === 'boolean') this.toggleVel.checked = settings.showVel;
      if (typeof settings.showTrails === 'boolean') this.toggleTrails.checked = settings.showTrails;
      if (typeof settings.showSeekerFOV === 'boolean' && this.toggleSeekerFov) {
        this.toggleSeekerFov.checked = settings.showSeekerFOV;
      } else if (this.toggleSeekerFov) {
        this.toggleSeekerFov.checked = false;
      }
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

    if (this.btnSavePath) {
      this.btnSavePath.addEventListener('click', () => {
        if (this.callbacks.onSavePath) this.callbacks.onSavePath();
      });
    }

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

    this.gLimitInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.valGLimit.textContent = val;
      this.saveSettings();
      if (this.callbacks.onGLimitChange) this.callbacks.onGLimitChange(val);
    });

    this.toggleAeroLimit.addEventListener('change', (e) => {
      this.saveSettings();
      if (this.callbacks.onAeroLimitChange) this.callbacks.onAeroLimitChange(e.target.checked);
    });

    if (this.toggleLobl) {
      this.toggleLobl.addEventListener('change', (e) => {
        this.saveSettings();
        if (this.callbacks.onLOBLChange) this.callbacks.onLOBLChange(e.target.checked);
      });
    }

    // Overlay checkboxes
    [this.toggleLos, this.toggleAccel, this.toggleVel, this.toggleTrails, this.toggleSeekerFov].forEach((chk) => {
      if (chk) {
        chk.addEventListener('change', () => {
          this.saveSettings();
        });
      }
    });
  }

  updateLaunchButton(isLaunched, telemetry) {
    if (isLaunched) {
      this.btnLaunch.textContent = '🚀 In Flight';
      this.btnLaunch.classList.remove('btn-no-lock');
    } else {
      const isLoblBlocked = telemetry && telemetry.loblEnabled && !telemetry.inSeekerFOV;
      if (isLoblBlocked) {
        this.btnLaunch.textContent = '🔒 No Lock (Out of FOV)';
        this.btnLaunch.classList.add('btn-no-lock');
      } else {
        this.btnLaunch.textContent = '🚀 Launch';
        this.btnLaunch.classList.remove('btn-no-lock');
      }
    }
  }

  getOverlayConfig() {
    return {
      showLOS: this.toggleLos.checked,
      showAccel: this.toggleAccel.checked,
      showVel: this.toggleVel.checked,
      showTrails: this.toggleTrails.checked,
      showSeekerFOV: this.toggleSeekerFov ? this.toggleSeekerFov.checked : false
    };
  }
}
