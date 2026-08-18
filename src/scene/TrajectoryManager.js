import * as THREE from 'three';
import { RibbonTrail } from './RibbonTrail.js';

const PATH_COLORS = [
  0x88C0D0, // Frost Cyan (Nord8)
  0xEBCB8B, // Aurora Gold (Nord13)
  0xD08770, // Aurora Orange (Nord12)
  0xB48EAD, // Aurora Purple (Nord15)
  0xA3BE8C, // Aurora Green (Nord14)
  0x81A1C1, // Frost Blue (Nord9)
  0x8FBCBB, // Frost Teal (Nord7)
  0xBF616A  // Aurora Red (Nord11)
];

export class TrajectoryManager {
  constructor(scene) {
    this.scene = scene;
    this.trajectories = [];
    this.nextId = 1;
  }

  /**
   * Saves a missile flight trajectory run
   * @param {Array<THREE.Vector3>} trailPoints
   * @param {Object} meta - { flightTime, isHit, isMissed, navGain, missileSpeed, targetPattern }
   * @returns {Object|null} trajectory item
   */
  addTrajectory(trailPoints, meta = {}) {
    if (!trailPoints || trailPoints.length < 2) return null;

    const id = this.nextId++;
    const colorIndex = (id - 1) % PATH_COLORS.length;
    const colorHex = PATH_COLORS[colorIndex];
    const colorCSS = '#' + colorHex.toString(16).padStart(6, '0');

    // Clone points so resets do not modify historical trajectory
    const points = trailPoints.map(p => p.clone());

    // Create persistent 3D ribbon trail in the scene
    const ribbonTrail = new RibbonTrail(this.scene, colorHex, 2.0, points.length);
    ribbonTrail.update(points, true, meta.camera || null);

    const trajectory = {
      id,
      name: `Run #${id}`,
      colorHex,
      colorCSS,
      points,
      ribbonTrail,
      visible: true,
      meta: {
        flightTime: typeof meta.flightTime === 'number' ? meta.flightTime : 0,
        isHit: !!meta.isHit,
        isMissed: !!meta.isMissed,
        navGain: meta.navGain || 4.0,
        missileSpeed: meta.missileSpeed || 400,
        targetPattern: meta.targetPattern || 'coastal-crossing',
        timestamp: Date.now()
      }
    };

    this.trajectories.push(trajectory);
    return trajectory;
  }

  toggleVisibility(id, camera = null) {
    const traj = this.trajectories.find(t => t.id === id);
    if (!traj) return false;
    traj.visible = !traj.visible;
    traj.ribbonTrail.update(traj.points, traj.visible, camera);
    return traj.visible;
  }

  update(camera) {
    for (let i = 0; i < this.trajectories.length; i++) {
      const traj = this.trajectories[i];
      if (traj.visible && traj.ribbonTrail) {
        traj.ribbonTrail.update(traj.points, true, camera);
      }
    }
  }

  removeTrajectory(id) {
    const index = this.trajectories.findIndex(t => t.id === id);
    if (index === -1) return;
    const [traj] = this.trajectories.splice(index, 1);
    if (traj && traj.ribbonTrail) {
      traj.ribbonTrail.dispose();
    }
  }

  clearAll() {
    this.trajectories.forEach(t => {
      if (t.ribbonTrail) {
        t.ribbonTrail.dispose();
      }
    });
    this.trajectories = [];
  }

  getTrajectories() {
    return this.trajectories;
  }
}
