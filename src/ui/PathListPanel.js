export class PathListPanel {
  constructor(options = {}) {
    this.onToggleVisibility = options.onToggleVisibility || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onClearAll = options.onClearAll || (() => {});

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.panel = document.getElementById('path-panel');
    this.pathList = document.getElementById('path-list');
    this.pathCount = document.getElementById('path-count');
    this.btnClearAll = document.getElementById('btn-clear-paths');
    this.btnToggle = document.getElementById('btn-toggle-path-panel');
  }

  bindEvents() {
    if (this.btnToggle && this.panel) {
      this.btnToggle.addEventListener('click', () => {
        const isCollapsed = this.panel.classList.toggle('panel-collapsed');
        this.btnToggle.setAttribute('aria-expanded', !isCollapsed);
        this.btnToggle.textContent = isCollapsed ? '▶' : '▼';
      });
    }

    if (this.btnClearAll) {
      this.btnClearAll.addEventListener('click', () => {
        this.onClearAll();
      });
    }

    if (this.pathList) {
      this.pathList.addEventListener('click', (e) => {
        const btnVis = e.target.closest('.btn-path-vis');
        if (btnVis) {
          const id = parseInt(btnVis.dataset.id, 10);
          this.onToggleVisibility(id);
          return;
        }

        const btnDel = e.target.closest('.btn-path-del');
        if (btnDel) {
          const id = parseInt(btnDel.dataset.id, 10);
          this.onDelete(id);
          return;
        }
      });
    }
  }

  render(trajectories = []) {
    if (!this.pathList) return;

    if (this.pathCount) {
      this.pathCount.textContent = trajectories.length;
    }

    if (this.btnClearAll) {
      this.btnClearAll.style.display = trajectories.length > 0 ? 'inline-block' : 'none';
    }

    if (trajectories.length === 0) {
      this.pathList.innerHTML = '<div class="path-empty-hint">No saved trajectories.<br/>Click "💾 Save" to save a run.</div>';
      return;
    }

    let html = '';
    trajectories.forEach((traj) => {
      const outcome = traj.meta.isHit ? 'HIT' : (traj.meta.isMissed ? 'MISS' : 'SAVED');
      const outcomeClass = traj.meta.isHit ? 'outcome-hit' : (traj.meta.isMissed ? 'outcome-miss' : 'outcome-active');
      const timeStr = `${traj.meta.flightTime.toFixed(1)}s`;
      const patternName = traj.meta.targetPattern === 'coastal-crossing' ? 'Coastal'
        : (traj.meta.targetPattern === 'direct-inbound' ? 'Inbound' : 'Beam');

      const visIcon = traj.visible ? '👁️' : '🙈';
      const visClass = traj.visible ? 'is-visible' : 'is-hidden';
      const visTitle = traj.visible ? 'Hide Trajectory' : 'Show Trajectory';

      html += `
        <div class="path-item ${visClass}" style="--path-color: ${traj.colorCSS};" data-id="${traj.id}">
          <div class="path-info">
            <div class="path-title-row">
              <span class="path-color-dot" style="background-color: ${traj.colorCSS};"></span>
              <span class="path-title">${traj.name}</span>
              <span class="path-outcome ${outcomeClass}">${outcome}</span>
            </div>
            <div class="path-meta">
              N=${traj.meta.navGain} • ${traj.meta.missileSpeed}m/s • ${timeStr} • ${patternName}
            </div>
          </div>
          <div class="path-actions">
            <button type="button" class="btn-icon btn-path-vis" data-id="${traj.id}" title="${visTitle}" aria-label="${visTitle}">${visIcon}</button>
            <button type="button" class="btn-icon btn-path-del" data-id="${traj.id}" title="Delete Run" aria-label="Delete Run">🗑️</button>
          </div>
        </div>
      `;
    });

    this.pathList.innerHTML = html;
  }
}
