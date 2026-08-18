import * as THREE from 'three';

export class RibbonTrail {
  constructor(scene, color = 0x32d74b, width = 2.0, maxPoints = 800) {
    this.scene = scene;
    this.width = width;
    this.maxPoints = maxPoints;

    this.geometry = new THREE.BufferGeometry();
    // 2 vertices per trail point (left & right)
    this.positions = new Float32Array(maxPoints * 2 * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Triangle indices
    const indices = [];
    for (let i = 0; i < maxPoints - 1; i++) {
      const p = i * 2;
      indices.push(p, p + 1, p + 2);
      indices.push(p + 2, p + 1, p + 3);
    }
    this.geometry.setIndex(indices);
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthTest: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = 10; // Guaranteed to render on top of water (renderOrder=1)
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  update(points, isVisible = true, camera = null) {
    if (isVisible !== true || !points || points.length < 2) {
      this.mesh.visible = false;
      this.geometry.setDrawRange(0, 0);
      return;
    }

    this.mesh.visible = true;
    const count = Math.min(points.length, this.maxPoints);
    const posAttr = this.geometry.attributes.position;
    const posArray = posAttr.array;

    const camPos = camera ? camera.position : null;
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const vCam = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const curr = points[i];
      if (i < count - 1) {
        tangent.subVectors(points[i + 1], curr);
      } else {
        tangent.subVectors(curr, points[i - 1]);
      }
      if (tangent.lengthSq() < 1e-6) {
        tangent.set(0, 0, -1);
      } else {
        tangent.normalize();
      }

      let halfWidth = this.width * 0.5;

      if (camPos) {
        vCam.subVectors(camPos, curr);
        const dist = vCam.length();
        // Camera distance adaptive scaling: maintain visibility at long ranges while looking natural up close
        const dynamicWidth = Math.min(Math.max(this.width + dist * 0.008, this.width), 45.0);
        halfWidth = dynamicWidth * 0.5;

        // Camera billboard side vector: perpendicular to tangent and camera view ray
        if (dist > 1e-3) {
          vCam.divideScalar(dist);
          side.crossVectors(tangent, vCam);
        } else {
          side.crossVectors(tangent, up);
        }

        if (side.lengthSq() < 1e-4) {
          side.crossVectors(tangent, up);
          if (side.lengthSq() < 1e-4) {
            side.crossVectors(tangent, new THREE.Vector3(1, 0, 0));
          }
        }
      } else {
        side.crossVectors(tangent, up);
        if (side.lengthSq() < 1e-4) {
          side.crossVectors(tangent, new THREE.Vector3(1, 0, 0));
        }
      }

      side.normalize().multiplyScalar(halfWidth);

      const idx = i * 6;
      // Left vertex
      posArray[idx] = curr.x - side.x;
      posArray[idx + 1] = curr.y - side.y;
      posArray[idx + 2] = curr.z - side.z;

      // Right vertex
      posArray[idx + 3] = curr.x + side.x;
      posArray[idx + 4] = curr.y + side.y;
      posArray[idx + 5] = curr.z + side.z;
    }

    posAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, (count - 1) * 6);
  }

  dispose() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}
