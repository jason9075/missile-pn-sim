import * as THREE from 'three';

export class MissileModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    this.initMesh();
    this.initTrail();
    this.initVectors();
    this.initExplosion();
    
    this.scene.add(this.group);
  }

  initMesh() {
    this.meshGroup = new THREE.Group();

    // Missile Body (Cylinder along Z axis)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
    bodyGeo.rotateX(Math.PI / 2); // Orient along Z axis (0,0,-1)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xD8DEE9, metalness: 0.6, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.meshGroup.add(body);

    // Nose Cone (Conical Tip pointing to -Z)
    const noseGeo = new THREE.ConeGeometry(0.5, 2, 16);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.translate(0, 0, -4);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xBF616A, metalness: 0.4, roughness: 0.2 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    this.meshGroup.add(nose);

    // Tail Fins (4 fins)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(1.2, -1.0);
    finShape.lineTo(1.2, -2.5);
    finShape.lineTo(0, -2.0);
    finShape.closePath();

    const extrudeSettings = { depth: 0.05, bevelEnabled: false };
    const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x434C5E, metalness: 0.7 });

    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (Math.PI / 2) * i;
      fin.position.z = 2.5;
      this.meshGroup.add(fin);
    }

    // Thruster Flame Light & Cone
    const flameGeo = new THREE.ConeGeometry(0.4, 3, 12);
    flameGeo.rotateX(Math.PI / 2);
    flameGeo.translate(0, 0, 4.5);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xD08770, transparent: true, opacity: 0.85 });
    this.flame = new THREE.Mesh(flameGeo, flameMat);
    this.meshGroup.add(this.flame);

    this.thrusterLight = new THREE.PointLight(0xD08770, 3, 30);
    this.thrusterLight.position.set(0, 0, 3);
    this.meshGroup.add(this.thrusterLight);

    this.group.add(this.meshGroup);
  }

  initTrail() {
    const maxPoints = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x88C0D0,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.85
    });

    this.trailLine = new THREE.Line(geometry, material);
    this.scene.add(this.trailLine);
  }

  initVectors() {
    this.vectorGroup = new THREE.Group();

    // 1. Missile Acceleration Command Arrow (Red: #BF616A)
    this.accelArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      20,
      0xBF616A,
      4,
      2
    );

    // 2. Missile Velocity Vector Arrow (Blue: #81A1C1)
    this.velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      30,
      0x81A1C1,
      5,
      2.5
    );

    // 3. Line of Sight Vector Line (Yellow: #EBCB8B)
    const losGeo = new THREE.BufferGeometry();
    losGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const losMat = new THREE.LineDashedMaterial({
      color: 0xEBCB8B,
      dashSize: 10,
      gapSize: 5,
      linewidth: 2
    });
    this.losLine = new THREE.Line(losGeo, losMat);

    this.accelArrow.visible = false;
    this.velArrow.visible = false;

    this.vectorGroup.add(this.accelArrow);
    this.vectorGroup.add(this.velArrow);
    this.scene.add(this.losLine);
    this.scene.add(this.vectorGroup);
  }

  initExplosion() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const p = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      velocities[i * 3] = p.x;
      velocities[i * 3 + 1] = p.y;
      velocities[i * 3 + 2] = p.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.explosionVelocities = velocities;

    const material = new THREE.PointsMaterial({
      color: 0xEBCB8B,
      size: 4,
      transparent: true,
      opacity: 1.0
    });

    this.explosionParticles = new THREE.Points(geometry, material);
    this.explosionParticles.visible = false;
    this.scene.add(this.explosionParticles);
    this.explosionTime = 0;
  }

  triggerExplosion(pos) {
    this.explosionParticles.position.copy(pos);
    this.explosionParticles.visible = true;
    this.explosionTime = 0;
  }

  updateExplosion(dt) {
    if (!this.explosionParticles.visible) return;
    this.explosionTime += dt;
    if (this.explosionTime > 2.0) {
      this.explosionParticles.visible = false;
      return;
    }

    const posAttr = this.explosionParticles.geometry.attributes.position;
    const pos = posAttr.array;
    const vel = this.explosionVelocities;

    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }

    posAttr.needsUpdate = true;
    this.explosionParticles.material.opacity = 1.0 - (this.explosionTime / 2.0);
  }

  update(missilePhysics, targetPhysics, overlaysConfig) {
    // 1. Update Mesh position & orientation
    this.group.position.copy(missilePhysics.position);
    this.group.quaternion.copy(missilePhysics.orientation);

    // Flame flicker
    if (missilePhysics.isLaunched && !missilePhysics.isHit && !missilePhysics.isMissed) {
      this.flame.visible = true;
      this.thrusterLight.intensity = 2.5 + Math.random() * 1.5;
    } else {
      this.flame.visible = false;
      this.thrusterLight.intensity = 0;
    }

    // 2. Update Trail
    if (overlaysConfig.showTrails) {
      this.trailLine.visible = true;
      const posAttr = this.trailLine.geometry.attributes.position;
      const trail = missilePhysics.trail;
      for (let i = 0; i < trail.length; i++) {
        posAttr.setXYZ(i, trail[i].x, trail[i].y, trail[i].z);
      }
      this.trailLine.geometry.setDrawRange(0, trail.length);
      posAttr.needsUpdate = true;
    } else {
      this.trailLine.visible = false;
    }

    // 3. Update Vector Overlays
    this.vectorGroup.position.copy(missilePhysics.position);

    // Accel Command Arrow
    if (overlaysConfig.showAccel && missilePhysics.isLaunched && missilePhysics.lastAppliedAccel.lengthSq() > 1e-3) {
      this.accelArrow.visible = true;
      const mag = missilePhysics.lastAppliedAccel.length();
      const dir = missilePhysics.lastAppliedAccel.clone().normalize();
      this.accelArrow.setDirection(dir);
      this.accelArrow.setLength(Math.min(mag * 0.25, 60), 5, 2.5);
    } else {
      this.accelArrow.visible = false;
    }

    // Velocity Vector Arrow
    if (overlaysConfig.showVel && missilePhysics.velocity.lengthSq() > 1e-3) {
      this.velArrow.visible = true;
      const dir = missilePhysics.velocity.clone().normalize();
      this.velArrow.setDirection(dir);
      this.velArrow.setLength(35, 5, 2.5);
    } else {
      this.velArrow.visible = false;
    }

    // Line of Sight Line
    if (overlaysConfig.showLOS && !missilePhysics.isHit) {
      this.losLine.visible = true;
      const losPos = this.losLine.geometry.attributes.position;
      losPos.setXYZ(0, missilePhysics.position.x, missilePhysics.position.y, missilePhysics.position.z);
      losPos.setXYZ(1, targetPhysics.position.x, targetPhysics.position.y, targetPhysics.position.z);
      losPos.needsUpdate = true;
      this.losLine.computeLineDistances();
    } else {
      this.losLine.visible = false;
    }
  }
}
