import * as THREE from 'three';
import { RibbonTrail } from './RibbonTrail.js';

export class TargetModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.propellerRotation = 0;
    this.isHitVisual = false;
    
    this.initMaterials();
    this.initMesh();
    this.initTrail();
    this.initVector();

    this.scene.add(this.group);
  }

  initMaterials() {
    // 1. Standard Military Material Palettes
    this.matBody = new THREE.MeshStandardMaterial({
      color: 0x4C566A, // Military Tactical Slate Gray
      metalness: 0.35,
      roughness: 0.55,
    });

    this.matDarkTrim = new THREE.MeshStandardMaterial({
      color: 0x2E3440, // Dark Carbon Composite / Panel Trim
      metalness: 0.5,
      roughness: 0.4,
    });

    this.matEngine = new THREE.MeshStandardMaterial({
      color: 0x3B4252, // Cast Iron / Engine Block
      metalness: 0.8,
      roughness: 0.3,
    });

    this.matExhaust = new THREE.MeshStandardMaterial({
      color: 0x2E3440,
      metalness: 0.9,
      roughness: 0.2,
    });

    this.matPropeller = new THREE.MeshStandardMaterial({
      color: 0x242933,
      metalness: 0.4,
      roughness: 0.5,
    });

    this.matYellowTip = new THREE.MeshBasicMaterial({
      color: 0xEBCB8B, // Yellow Propeller Warning Tips
    });

    this.redLedMat = new THREE.MeshBasicMaterial({ color: 0xBF616A });
    this.greenLedMat = new THREE.MeshBasicMaterial({ color: 0xA3BE8C });

    // 2. Intercepted Hit Hologram / Ghost Red Transparent Material
    this.hitMaterial = new THREE.MeshStandardMaterial({
      color: 0xBF616A, // Tactical Red (#BF616A)
      emissive: 0x5c0e18, // Internal thermal red glow
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

    // ─── 1. Delta Wing Main Body (Cropped Delta Shape) ───────────────
    const wingShape = new THREE.Shape();
    // Forward is -Z, Right is +X
    wingShape.moveTo(0, -2.4);          // Sharp Nose Tip
    wingShape.lineTo(0.35, -2.2);
    wingShape.lineTo(3.2, 1.2);          // Right Wingtip Leading Corner
    wingShape.lineTo(3.2, 1.6);          // Right Wingtip Trailing Corner
    wingShape.lineTo(0.7, 1.6);          // Right Trailing Edge Root
    wingShape.lineTo(0.5, 1.8);          // Engine Bay Notch Right
    wingShape.lineTo(-0.5, 1.8);         // Engine Bay Notch Left
    wingShape.lineTo(-0.7, 1.6);         // Left Trailing Edge Root
    wingShape.lineTo(-3.2, 1.6);         // Left Wingtip Trailing Corner
    wingShape.lineTo(-3.2, 1.2);         // Left Wingtip Leading Corner
    wingShape.lineTo(-0.35, -2.2);
    wingShape.closePath();

    const extrudeSettings = {
      depth: 0.36,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.14
    };

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2); // Lay flat on XZ plane
    const wingMesh = new THREE.Mesh(wingGeo, this.matBody);
    wingMesh.castShadow = true;
    wingMesh.receiveShadow = true;
    this.registerMesh(wingMesh, this.matBody);
    this.meshGroup.add(wingMesh);

    // ─── 2. Blended Centerline Fuselage / Avionics Spine ─────────────
    const spineGeo = new THREE.CylinderGeometry(0.38, 0.55, 3.4, 16);
    spineGeo.rotateX(Math.PI / 2);
    spineGeo.scale(1.2, 0.7, 1.0); // Elliptical cross-section
    const spineMesh = new THREE.Mesh(spineGeo, this.matBody);
    spineMesh.position.set(0, 0.18, -0.2);
    spineMesh.castShadow = true;
    this.registerMesh(spineMesh, this.matBody);
    this.meshGroup.add(spineMesh);

    // Nose Cone Cap
    const noseGeo = new THREE.ConeGeometry(0.38, 0.9, 16);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.2, 0.7, 1.0);
    const noseMesh = new THREE.Mesh(noseGeo, this.matDarkTrim);
    noseMesh.position.set(0, 0.18, -2.1);
    this.registerMesh(noseMesh, this.matDarkTrim);
    this.meshGroup.add(noseMesh);

    // Nose Pitot Tube (Airspeed needle)
    const pitotGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8);
    pitotGeo.rotateX(Math.PI / 2);
    const pitotMat = new THREE.MeshStandardMaterial({ color: 0xD8DEE9, metalness: 0.9, roughness: 0.1 });
    const pitotMesh = new THREE.Mesh(pitotGeo, pitotMat);
    pitotMesh.position.set(0, 0.18, -2.7);
    this.registerMesh(pitotMesh, pitotMat);
    this.meshGroup.add(pitotMesh);

    // Satellite Navigation (CRPA GPS / GLONASS Dome Puck)
    const gpsGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.1, 16);
    const gpsMat = new THREE.MeshStandardMaterial({ color: 0xD8DEE9, roughness: 0.3 });
    const gpsPuck = new THREE.Mesh(gpsGeo, gpsMat);
    gpsPuck.position.set(0, 0.44, -0.4);
    this.registerMesh(gpsPuck, gpsMat);
    this.meshGroup.add(gpsPuck);

    // ─── 3. Iconic Vertical Winglets / Endplate Stabilizers ──────────
    const wingletShape = new THREE.Shape();
    wingletShape.moveTo(0, -0.35);       // Ventral bottom front
    wingletShape.lineTo(0.55, 0.95);     // Dorsal top tip
    wingletShape.lineTo(0.85, 0.85);     // Dorsal top rear
    wingletShape.lineTo(0.80, -0.35);    // Ventral bottom rear
    wingletShape.closePath();

    const wingletExtrude = { depth: 0.06, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.02, bevelThickness: 0.02 };
    const wingletGeo = new THREE.ExtrudeGeometry(wingletShape, wingletExtrude);
    wingletGeo.rotateY(-Math.PI / 2); // Orient along Z axis

    // Left Winglet (x = -3.2)
    const leftWinglet = new THREE.Mesh(wingletGeo, this.matDarkTrim);
    leftWinglet.position.set(-3.2, 0, 0.85);
    leftWinglet.castShadow = true;
    this.registerMesh(leftWinglet, this.matDarkTrim);
    this.meshGroup.add(leftWinglet);

    // Right Winglet (x = +3.2)
    const rightWinglet = new THREE.Mesh(wingletGeo, this.matDarkTrim);
    rightWinglet.position.set(3.2, 0, 0.85);
    rightWinglet.castShadow = true;
    this.registerMesh(rightWinglet, this.matDarkTrim);
    this.meshGroup.add(rightWinglet);

    // ─── 4. MD-550 Rear Piston Engine Bay ────────────────────────────
    const engineBoxGeo = new THREE.BoxGeometry(0.9, 0.6, 0.85);
    const engineBox = new THREE.Mesh(engineBoxGeo, this.matEngine);
    engineBox.position.set(0, 0.15, 1.4);
    engineBox.castShadow = true;
    this.registerMesh(engineBox, this.matEngine);
    this.meshGroup.add(engineBox);

    // Opposed Cylinder Heads (2 on left, 2 on right)
    const cylGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12);
    cylGeo.rotateZ(Math.PI / 2);
    
    const cyl1 = new THREE.Mesh(cylGeo, this.matDarkTrim);
    cyl1.position.set(-0.55, 0.15, 1.25);
    this.registerMesh(cyl1, this.matDarkTrim);
    this.meshGroup.add(cyl1);

    const cyl2 = new THREE.Mesh(cylGeo, this.matDarkTrim);
    cyl2.position.set(-0.55, 0.15, 1.55);
    this.registerMesh(cyl2, this.matDarkTrim);
    this.meshGroup.add(cyl2);

    const cyl3 = new THREE.Mesh(cylGeo, this.matDarkTrim);
    cyl3.position.set(0.55, 0.15, 1.25);
    this.registerMesh(cyl3, this.matDarkTrim);
    this.meshGroup.add(cyl3);

    const cyl4 = new THREE.Mesh(cylGeo, this.matDarkTrim);
    cyl4.position.set(0.55, 0.15, 1.55);
    this.registerMesh(cyl4, this.matDarkTrim);
    this.meshGroup.add(cyl4);

    // Twin Exhaust Stubs
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.45, 8);
    exhaustGeo.rotateX(Math.PI / 3);
    const exhLeft = new THREE.Mesh(exhaustGeo, this.matExhaust);
    exhLeft.position.set(-0.35, -0.15, 1.75);
    this.registerMesh(exhLeft, this.matExhaust);
    this.meshGroup.add(exhLeft);

    const exhRight = new THREE.Mesh(exhaustGeo, this.matExhaust);
    exhRight.position.set(0.35, -0.15, 1.75);
    this.registerMesh(exhRight, this.matExhaust);
    this.meshGroup.add(exhRight);

    // ─── 5. Animated Pusher Propeller Assembly ───────────────────────
    this.propellerGroup = new THREE.Group();
    this.propellerGroup.position.set(0, 0.15, 1.88); // Mounted at engine tail

    // Spinner Hub Cone
    const spinnerGeo = new THREE.ConeGeometry(0.16, 0.35, 12);
    spinnerGeo.rotateX(Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, this.matDarkTrim);
    this.registerMesh(spinner, this.matDarkTrim);
    this.propellerGroup.add(spinner);

    // 2-Blade Wooden/Carbon Propeller
    const bladeGeo = new THREE.BoxGeometry(0.12, 1.35, 0.03);
    const blade1 = new THREE.Mesh(bladeGeo, this.matPropeller);
    blade1.position.set(0, 0, 0.05);
    blade1.rotation.z = 0.15;
    this.registerMesh(blade1, this.matPropeller);
    this.propellerGroup.add(blade1);

    // Yellow warning stripes on blade tips
    const tipGeo = new THREE.BoxGeometry(0.125, 0.18, 0.035);
    const tipTop = new THREE.Mesh(tipGeo, this.matYellowTip);
    tipTop.position.set(0, 0.60, 0.05);
    this.registerMesh(tipTop, this.matYellowTip);
    this.propellerGroup.add(tipTop);

    const tipBottom = new THREE.Mesh(tipGeo, this.matYellowTip);
    tipBottom.position.set(0, -0.60, 0.05);
    this.registerMesh(tipBottom, this.matYellowTip);
    this.propellerGroup.add(tipBottom);

    // High-speed Propeller Motion Blur Disc
    const blurGeo = new THREE.RingGeometry(0.2, 0.72, 32);
    const blurMat = new THREE.MeshBasicMaterial({
      color: 0x88C0D0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    this.blurDisc = new THREE.Mesh(blurGeo, blurMat);
    this.blurDisc.position.set(0, 0, 0.02);
    this.propellerGroup.add(this.blurDisc);

    this.meshGroup.add(this.propellerGroup);

    // ─── 6. Wingtip Navigation LEDs ──────────────────────────────────
    const ledGeo = new THREE.SphereGeometry(0.08, 8, 8);

    const leftLed = new THREE.Mesh(ledGeo, this.redLedMat);
    leftLed.position.set(-3.25, 0.2, 0.85);
    this.registerMesh(leftLed, this.redLedMat);
    this.meshGroup.add(leftLed);

    const rightLed = new THREE.Mesh(ledGeo, this.greenLedMat);
    rightLed.position.set(3.25, 0.2, 0.85);
    this.registerMesh(rightLed, this.greenLedMat);
    this.meshGroup.add(rightLed);

    this.group.add(this.meshGroup);
  }

  setHitVisualState(isHit) {
    if (this.isHitVisual === isHit) return;
    this.isHitVisual = isHit;

    if (isHit) {
      // Switch all meshes to red transparent hit material & renderOrder 5 (above water)
      this.meshGroup.traverse((child) => {
        if (child.isMesh && child !== this.blurDisc) {
          child.material = this.hitMaterial;
          child.renderOrder = 5;
        }
      });
      if (this.blurDisc) {
        this.blurDisc.visible = false;
      }
    } else {
      // Restore standard military textures
      this.meshGroup.traverse((child) => {
        if (child.isMesh && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
          child.renderOrder = 0;
        }
      });
      if (this.blurDisc) {
        this.blurDisc.visible = true;
      }
    }
  }

  initTrail() {
    // 3D Crimson Red ribbon trail for hostile target (width 2.2m)
    this.ribbonTrail = new RibbonTrail(this.scene, 0xFF3B56, 2.2, 700);
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
    this.velArrow.visible = false;
    this.scene.add(this.velArrow);
  }

  update(targetPhysics, overlaysConfig, delta = 0.016, camera = null) {
    // 1. Check hit status and switch visual mesh material
    if (targetPhysics.isHit) {
      this.setHitVisualState(true);
    } else {
      this.setHitVisualState(false);
    }

    // 2. Position & Orientation
    this.group.position.copy(targetPhysics.position);
    if (!targetPhysics.isHit && targetPhysics.velocity.lengthSq() > 1e-5) {
      const dir = targetPhysics.velocity.clone().normalize();
      const forward = new THREE.Vector3(0, 0, -1);
      const q = new THREE.Quaternion().setFromUnitVectors(forward, dir);
      this.group.quaternion.copy(q);
    }

    // 3. Pusher Propeller Spin Animation (only spins when active/unhit and not missed)
    if (!targetPhysics.isHit && !targetPhysics.isMissed && this.propellerGroup) {
      this.propellerRotation += delta * 60.0;
      this.propellerGroup.rotation.z = this.propellerRotation;
    }

    // 4. Trail
    if (this.ribbonTrail) {
      this.ribbonTrail.update(targetPhysics.trail, overlaysConfig && overlaysConfig.showTrails, camera);
    }

    // 5. Velocity Overlay Arrow
    if (overlaysConfig && overlaysConfig.showVel && !targetPhysics.isHit && !targetPhysics.isMissed && targetPhysics.velocity.lengthSq() > 1e-3) {
      this.velArrow.visible = true;
      this.velArrow.position.copy(targetPhysics.position);
      const dir = targetPhysics.velocity.clone().normalize();
      this.velArrow.setDirection(dir);
    } else {
      this.velArrow.visible = false;
    }
  }
}
