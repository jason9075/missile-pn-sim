import * as THREE from 'three';
import { RibbonTrail } from './RibbonTrail.js';

export class MissileModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.isHitVisual = false;
    
    this.initMaterials();
    this.initMesh();
    this.initTrail();
    this.initVectors();
    this.initSeekerFOV();
    this.initExplosion();
    
    this.scene.add(this.group);
  }

  initMaterials() {
    this.matBody = new THREE.MeshStandardMaterial({ color: 0xD8DEE9, metalness: 0.6, roughness: 0.3 });
    this.matNose = new THREE.MeshStandardMaterial({ color: 0xBF616A, metalness: 0.4, roughness: 0.2 });
    this.matFin = new THREE.MeshStandardMaterial({ color: 0x4C566A, metalness: 0.7, roughness: 0.3 });

    // Intercepted Hit Hologram / Ghost Blue Transparent Material for missile
    this.hitMaterial = new THREE.MeshStandardMaterial({
      color: 0x88C0D0, // Frost Hologram Cyan / Blue (#88C0D0)
      emissive: 0x1B4965, // Internal thermal cyan-blue glow
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  }

  registerMesh(mesh, defaultMaterial) {
    mesh.material = defaultMaterial;
    mesh.userData.originalMaterial = defaultMaterial;
    return mesh;
  }

  initMesh() {
    this.meshGroup = new THREE.Group();

    // Missile Body (Cylinder along Z axis)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
    bodyGeo.rotateX(Math.PI / 2); // Orient along Z axis (0,0,-1)
    const body = new THREE.Mesh(bodyGeo, this.matBody);
    this.registerMesh(body, this.matBody);
    this.meshGroup.add(body);

    // Nose Cone (Conical Tip pointing to -Z)
    const noseGeo = new THREE.ConeGeometry(0.5, 2, 16);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.translate(0, 0, -4);
    const nose = new THREE.Mesh(noseGeo, this.matNose);
    this.registerMesh(nose, this.matNose);
    this.meshGroup.add(nose);

    // Control Fins (Cruciform tail fins)
    const finGeo = new THREE.BoxGeometry(0.1, 2.5, 1.2);

    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeo, this.matFin);
      fin.position.z = 2.4;
      fin.rotation.z = (i * Math.PI) / 2;
      this.registerMesh(fin, this.matFin);
      this.meshGroup.add(fin);
    }

    // Mid-body Strakes / Wings
    const wingGeo = new THREE.BoxGeometry(0.08, 1.8, 2.0);
    for (let i = 0; i < 4; i++) {
      const wing = new THREE.Mesh(wingGeo, this.matFin);
      wing.position.z = -0.6;
      wing.rotation.z = (i * Math.PI) / 2 + Math.PI / 4;
      this.registerMesh(wing, this.matFin);
      this.meshGroup.add(wing);
    }

    // Rocket Exhaust Thruster Flame
    const flameGeo = new THREE.ConeGeometry(0.35, 3.5, 16);
    flameGeo.rotateX(Math.PI / 2);
    flameGeo.translate(0, 0, 4.5);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xD08770, transparent: true, opacity: 0.95 });
    this.flame = new THREE.Mesh(flameGeo, flameMat);
    this.flame.visible = false;
    this.meshGroup.add(this.flame);

    // PointLight for rocket plume illumination
    this.thrusterLight = new THREE.PointLight(0xD08770, 0, 40);
    this.thrusterLight.position.set(0, 0, 3.5);
    this.meshGroup.add(this.thrusterLight);

    this.group.add(this.meshGroup);
  }

  setHitVisualState(isHit) {
    if (this.isHitVisual === isHit) return;
    this.isHitVisual = isHit;

    if (isHit) {
      // Switch all missile meshes to blue transparent hit material & renderOrder 5
      this.meshGroup.traverse((child) => {
        if (child.isMesh && child !== this.flame) {
          child.material = this.hitMaterial;
          child.renderOrder = 5;
        }
      });
      this.flame.visible = false;
      this.thrusterLight.intensity = 0;
    } else {
      // Restore original military missile materials
      this.meshGroup.traverse((child) => {
        if (child.isMesh && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
          child.renderOrder = 0;
        }
      });
    }
  }

  initTrail() {
    // 3D Emerald Green ribbon trail for friendly missile (width 2.2m)
    this.ribbonTrail = new RibbonTrail(this.scene, 0x32D74B, 2.2, 800);
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
    this.accelArrow.visible = false;
    this.vectorGroup.add(this.accelArrow);

    // 2. Missile Velocity Vector Arrow (Green: #A3BE8C)
    this.velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      30,
      0xA3BE8C,
      5,
      2.5
    );
    this.velArrow.visible = false;
    this.vectorGroup.add(this.velArrow);

    // 3. Line of Sight (LOS) Vector Line
    const losMat = new THREE.LineDashedMaterial({
      color: 0xEBCB8B,
      dashSize: 8,
      gapSize: 4,
      linewidth: 2
    });
    const losGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -100)
    ]);
    this.losLine = new THREE.Line(losGeo, losMat);
    this.losLine.renderOrder = 12;
    this.losLine.computeLineDistances();
    this.scene.add(this.losLine);

    this.vectorGroup.renderOrder = 12;
    this.scene.add(this.vectorGroup);
  }

  initSeekerFOV() {
    this.seekerGroup = new THREE.Group();

    // Seeker visual cone parameters (40° half-angle, 350m range)
    const fovHalfAngleDeg = 40.0;
    const fovHalfAngleRad = THREE.MathUtils.degToRad(fovHalfAngleDeg);
    const range = 350.0;
    const baseRadius = range * Math.tan(fovHalfAngleRad);

    // 1. Translucent search volume cone mesh
    const coneGeo = new THREE.ConeGeometry(baseRadius, range, 32, 1, true);
    // Origin at apex (0,0,0), base at (0,-range,0)
    coneGeo.translate(0, -range / 2, 0);
    // Rotate so base points along -Z and apex is at (0,0,0)
    coneGeo.rotateX(Math.PI / 2);
    // Offset apex to missile nose tip (0, 0, -5.0)
    coneGeo.translate(0, 0, -5.0);

    this.seekerConeMat = new THREE.MeshBasicMaterial({
      color: 0x88C0D0, // Frost cyan (Nord8)
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.seekerConeMesh = new THREE.Mesh(coneGeo, this.seekerConeMat);
    this.seekerConeMesh.renderOrder = 10;
    this.seekerGroup.add(this.seekerConeMesh);

    // 2. Tactical Wireframe: Radial Ribs & Concentric Range Rings
    const linePositions = [];
    const noseTip = new THREE.Vector3(0, 0, -5.0);

    // 8 radial generator ribs from nose to cone base
    const numRibs = 8;
    for (let i = 0; i < numRibs; i++) {
      const angle = (i * Math.PI * 2) / numRibs;
      const x = baseRadius * Math.cos(angle);
      const y = baseRadius * Math.sin(angle);
      const z = -5.0 - range;
      linePositions.push(noseTip.x, noseTip.y, noseTip.z);
      linePositions.push(x, y, z);
    }

    // 3 Range Circles (at 1/3, 2/3, and full range)
    const ringFractions = [0.33, 0.66, 1.0];
    const ringSegments = 48;
    ringFractions.forEach((frac) => {
      const ringDist = range * frac;
      const ringRadius = ringDist * Math.tan(fovHalfAngleRad);
      const ringZ = -5.0 - ringDist;

      for (let i = 0; i < ringSegments; i++) {
        const a1 = (i * Math.PI * 2) / ringSegments;
        const a2 = ((i + 1) * Math.PI * 2) / ringSegments;
        linePositions.push(
          ringRadius * Math.cos(a1), ringRadius * Math.sin(a1), ringZ,
          ringRadius * Math.cos(a2), ringRadius * Math.sin(a2), ringZ
        );
      }
    });

    // Central Boresight Axis
    linePositions.push(noseTip.x, noseTip.y, noseTip.z);
    linePositions.push(0, 0, -5.0 - range);

    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    this.seekerLinesMat = new THREE.LineBasicMaterial({
      color: 0x88C0D0,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.seekerWireframe = new THREE.LineSegments(wireGeo, this.seekerLinesMat);
    this.seekerWireframe.renderOrder = 11;
    this.seekerGroup.add(this.seekerWireframe);

    this.seekerGroup.visible = false;
    this.group.add(this.seekerGroup);
  }

  initExplosion() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    const color1 = new THREE.Color(0xBF616A);
    const color2 = new THREE.Color(0xEBCB8B);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const c = Math.random() > 0.5 ? color1 : color2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 20 + Math.random() * 80;

      velocities.push(new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi)
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    this.explosionParticles = new THREE.Points(geometry, material);
    this.explosionParticles.renderOrder = 15;
    this.explosionParticles.visible = false;
    this.explosionVelocities = velocities;
    this.explosionTime = 0;
    this.explosionTriggered = false;

    this.scene.add(this.explosionParticles);
  }

  triggerExplosion(position) {
    this.explosionParticles.position.copy(position);
    this.explosionParticles.visible = true;
    this.explosionTime = 0;

    const posAttr = this.explosionParticles.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setXYZ(i, 0, 0, 0);
    }
    posAttr.needsUpdate = true;
    this.explosionParticles.material.opacity = 1;

    // Switch missile to blue transparent mesh
    this.setHitVisualState(true);
  }

  updateExplosion(delta) {
    if (!this.explosionParticles.visible) return;

    this.explosionTime += delta;
    const posAttr = this.explosionParticles.geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const v = this.explosionVelocities[i];
      const x = posAttr.getX(i) + v.x * delta;
      const y = posAttr.getY(i) + v.y * delta - 9.8 * delta * this.explosionTime;
      const z = posAttr.getZ(i) + v.z * delta;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    this.explosionParticles.material.opacity = Math.max(0, 1 - this.explosionTime / 2.0);

    if (this.explosionTime > 2.0) {
      this.explosionParticles.visible = false;
    }
  }

  update(missilePhysics, overlaysConfig, delta = 0.016, cameraMode = 'free', telemetry = null) {
    // 1. Check hit status and switch visual mesh material
    if (missilePhysics.isHit) {
      this.setHitVisualState(true);
    } else {
      this.setHitVisualState(false);
    }

    // In missile-pov (First Person Seeker POV), hide missile body mesh so it never obstructs the camera
    if (cameraMode === 'missile-pov') {
      this.meshGroup.visible = false;
    } else {
      this.meshGroup.visible = true;
    }

    // Update Missile Body Position & Orientation
    this.group.visible = true;
    this.group.position.copy(missilePhysics.position);
    this.group.quaternion.copy(missilePhysics.orientation);

    // Flame flicker (only when launched, active, and not in POV)
    if (missilePhysics.isLaunched && !missilePhysics.isHit && !missilePhysics.isMissed && cameraMode !== 'missile-pov') {
      this.flame.visible = true;
      this.thrusterLight.intensity = 2.5 + Math.random() * 1.5;
    } else {
      this.flame.visible = false;
      this.thrusterLight.intensity = 0;
    }

    // 2. Update Trail
    if (this.ribbonTrail) {
      this.ribbonTrail.update(missilePhysics.trail, !!(overlaysConfig && overlaysConfig.showTrails));
    }

    // 3. Update Vector Overlays
    this.vectorGroup.position.copy(missilePhysics.position);

    // Accel Command Arrow
    if (overlaysConfig && overlaysConfig.showAccel && missilePhysics.isLaunched && !missilePhysics.isHit && missilePhysics.lastAppliedAccel.lengthSq() > 1e-3) {
      this.accelArrow.visible = true;
      const mag = missilePhysics.lastAppliedAccel.length();
      const dir = missilePhysics.lastAppliedAccel.clone().normalize();
      this.accelArrow.setDirection(dir);
      this.accelArrow.setLength(Math.min(mag * 0.25, 60), 5, 2.5);
    } else {
      this.accelArrow.visible = false;
    }

    // Velocity Vector Arrow
    if (overlaysConfig && overlaysConfig.showVel && missilePhysics.isLaunched && !missilePhysics.isHit && missilePhysics.velocity.lengthSq() > 1e-3) {
      this.velArrow.visible = true;
      const dir = missilePhysics.velocity.clone().normalize();
      this.velArrow.setDirection(dir);
    } else {
      this.velArrow.visible = false;
    }

    // 4. Update Seeker FOV Overlay
    if (this.seekerGroup) {
      const showSeeker = overlaysConfig && overlaysConfig.showSeekerFOV && !missilePhysics.isHit;
      this.seekerGroup.visible = !!showSeeker;

      if (showSeeker && telemetry) {
        if (telemetry.inSeekerFOV) {
          // Target locked within seeker FOV - Cyan / Ice Blue (#88C0D0)
          this.seekerConeMat.color.setHex(0x88C0D0);
          this.seekerConeMat.opacity = 0.08;
          this.seekerLinesMat.color.setHex(0x88C0D0);
          this.seekerLinesMat.opacity = 0.38;
        } else {
          // Target outside seeker FOV (Gimbal limit exceeded) - Amber / Coral (#D08770)
          this.seekerConeMat.color.setHex(0xD08770);
          this.seekerConeMat.opacity = 0.06;
          this.seekerLinesMat.color.setHex(0xD08770);
          this.seekerLinesMat.opacity = 0.30;
        }
      }
    }

    // 5. Update Explosion Particles
    this.updateExplosion(delta);
  }

  updateLOS(missilePos, targetPos, visible) {
    if (visible) {
      this.losLine.visible = true;
      const posAttr = this.losLine.geometry.attributes.position;
      posAttr.setXYZ(0, missilePos.x, missilePos.y, missilePos.z);
      posAttr.setXYZ(1, targetPos.x, targetPos.y, targetPos.z);
      posAttr.needsUpdate = true;
      this.losLine.computeLineDistances();
    } else {
      this.losLine.visible = false;
    }
  }
}
