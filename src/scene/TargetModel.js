import * as THREE from 'three';

export class TargetModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    this.initMesh();
    this.initTrail();
    this.initVector();

    this.scene.add(this.group);
  }

  initMesh() {
    this.meshGroup = new THREE.Group();

    // Drone Fuselage (Delta-wing stealth drone body)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, -3);
    bodyShape.lineTo(6, 2);
    bodyShape.lineTo(0, 3);
    bodyShape.lineTo(-6, 2);
    bodyShape.closePath();

    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.2, bevelThickness: 0.3 };
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5E81AC, metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.meshGroup.add(body);

    // Jet Engine Intake Housing
    const engineGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x3B4252, metalness: 0.8 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, 0.4, 0.5);
    this.meshGroup.add(engine);

    // Thruster Engine Glow
    const engineGlowGeo = new THREE.CircleGeometry(0.7, 16);
    const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x88C0D0, side: THREE.DoubleSide });
    const engineGlow = new THREE.Mesh(engineGlowGeo, engineGlowMat);
    engineGlow.position.set(0, 0.4, 2.05);
    this.meshGroup.add(engineGlow);

    // Navigation LEDs (Red & Green on wingtips)
    const ledGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const redLedMat = new THREE.MeshBasicMaterial({ color: 0xBF616A });
    const greenLedMat = new THREE.MeshBasicMaterial({ color: 0xA3BE8C });

    const leftLed = new THREE.Mesh(ledGeo, redLedMat);
    leftLed.position.set(-6, 0, 2);
    this.meshGroup.add(leftLed);

    const rightLed = new THREE.Mesh(ledGeo, greenLedMat);
    rightLed.position.set(6, 0, 2);
    this.meshGroup.add(rightLed);

    this.group.add(this.meshGroup);
  }

  initTrail() {
    const maxPoints = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x81A1C1,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });

    this.trailLine = new THREE.Line(geometry, material);
    this.scene.add(this.trailLine);
  }

  initVector() {
    // Target Velocity Vector Arrow (Cyan: #88C0D0)
    this.velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      25,
      0x88C0D0,
      4,
      2
    );
    this.scene.add(this.velArrow);
  }

  update(targetPhysics, overlaysConfig) {
    // 1. Position & Orientation
    this.group.position.copy(targetPhysics.position);
    if (targetPhysics.velocity.lengthSq() > 1e-5) {
      const dir = targetPhysics.velocity.clone().normalize();
      const forward = new THREE.Vector3(0, 0, -1);
      const q = new THREE.Quaternion().setFromUnitVectors(forward, dir);
      this.group.quaternion.copy(q);
    }

    // 2. Trail
    if (overlaysConfig.showTrails) {
      this.trailLine.visible = true;
      const posAttr = this.trailLine.geometry.attributes.position;
      const trail = targetPhysics.trail;
      for (let i = 0; i < trail.length; i++) {
        posAttr.setXYZ(i, trail[i].x, trail[i].y, trail[i].z);
      }
      this.trailLine.geometry.setDrawRange(0, trail.length);
      posAttr.needsUpdate = true;
    } else {
      this.trailLine.visible = false;
    }

    // 3. Velocity Overlay Arrow
    if (overlaysConfig.showVel && targetPhysics.velocity.lengthSq() > 1e-3) {
      this.velArrow.visible = true;
      this.velArrow.position.copy(targetPhysics.position);
      const dir = targetPhysics.velocity.clone().normalize();
      this.velArrow.setDirection(dir);
    } else {
      this.velArrow.visible = false;
    }
  }
}
