import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import hdrUrl from '../../assets/citrus_orchard_road_puresky_1k.hdr';
import { Terrain } from './Terrain.js';
import { Water } from './Water.js';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    
    this.initSkybox();
    this.initLighting();
    this.initTerrainAndWater();
    this.initLauncher();
  }

  initSkybox() {
    // Load PureSky 1K HDR environment & skybox
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(hdrUrl, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
    }, undefined, (err) => {
      console.warn('Could not load HDR skybox:', err);
      this.scene.background = new THREE.Color(0x88c0d0);
    });
  }

  initLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xd8dee9, 0.85);
    this.scene.add(ambientLight);

    // Directional Sunlight aligned with HDR skybox sun
    const dirLight = new THREE.DirectionalLight(0xfff8e7, 2.6);
    dirLight.position.set(700, 1100, -600);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 3500;
    const d = 1600;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Accent key light for launcher platform atop the hillock
    const spotLight = new THREE.SpotLight(0x88c0d0, 2.2);
    spotLight.position.set(40, 122, 40);
    spotLight.target.position.set(0, 22, 0);
    spotLight.angle = Math.PI / 4;
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
  }

  initTerrainAndWater() {
    // 1. Procedural Strait Coastline & Islands Terrain
    this.terrain = new Terrain({ size: 5500, segments: 160 });
    this.scene.add(this.terrain.group);

    // 2. Animated Strait Ocean Water
    this.water = new Water({ width: 4500, length: 6000 });
    this.scene.add(this.water.mesh);
  }

  initLauncher() {
    this.launcherGroup = new THREE.Group();
    this.launcherGroup.position.set(0, 22.0, 0);

    // 1. Concrete Base Platform (Fixed on terrain hillock)
    const baseGeo = new THREE.BoxGeometry(24, 4, 24);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3B4252, roughness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.launcherGroup.add(baseMesh);

    // 2. Rotating Turret Assembly (Aimed towards incoming threat corridor across the strait)
    // Azimuth: 58 degrees (1.012 rad) East-Northeast, Elevation Pitch: 45 degrees
    const launchAzimuth = 1.012; // rad
    const launchPitch = Math.PI / 4; // 45 deg

    this.turretGroup = new THREE.Group();
    this.turretGroup.position.set(0, 4, 0);
    this.turretGroup.rotation.y = -launchAzimuth;

    // Turret Rotating Base Ring
    const turretGeo = new THREE.CylinderGeometry(8, 9, 2.5, 16);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x434C5E, metalness: 0.5, roughness: 0.4 });
    const turretMesh = new THREE.Mesh(turretGeo, turretMat);
    turretMesh.position.y = 1.25;
    turretMesh.castShadow = true;
    turretMesh.receiveShadow = true;
    this.turretGroup.add(turretMesh);

    // Elevation Trunnion Support Brackets (Left & Right)
    const bracketGeo = new THREE.BoxGeometry(1.5, 4.5, 3.5);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x3B4252, metalness: 0.6, roughness: 0.4 });
    
    const leftBracket = new THREE.Mesh(bracketGeo, bracketMat);
    leftBracket.position.set(-4.2, 3.5, 0);
    this.turretGroup.add(leftBracket);

    const rightBracket = new THREE.Mesh(bracketGeo, bracketMat);
    rightBracket.position.set(4.2, 3.5, 0);
    this.turretGroup.add(rightBracket);

    // 3. Elevating Quad Launch Tubes Assembly (Pivoting up towards threat)
    const elevatingAssembly = new THREE.Group();
    elevatingAssembly.position.set(0, 3.5, 0);
    elevatingAssembly.rotation.x = launchPitch; // +45 degree pitch up along -Z forward vector

    // Launch Tubes (aligned along Z axis: -Z forward, +Z back)
    const tubeGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 16);
    tubeGeo.rotateX(Math.PI / 2);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x4C566A, metalness: 0.7, roughness: 0.3 });

    const offsets = [
      [-2.4, 2.0],  [2.4, 2.0],   // Top row tubes
      [-2.4, -0.6], [2.4, -0.6]   // Bottom row tubes
    ];

    offsets.forEach(([x, y]) => {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(x, y, 0);
      tube.castShadow = true;
      tube.receiveShadow = true;
      elevatingAssembly.add(tube);
    });

    // Central Structural Mounting Frame
    const frameGeo = new THREE.BoxGeometry(6.5, 3.8, 9.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2E3440, metalness: 0.8, roughness: 0.3 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 0.7, 0);
    elevatingAssembly.add(frameMesh);

    this.turretGroup.add(elevatingAssembly);
    this.launcherGroup.add(this.turretGroup);

    this.scene.add(this.launcherGroup);
  }

  setLauncherAim(targetPos) {
    if (!targetPos || !this.turretGroup) return;
    const dx = targetPos.x - 0;
    const dz = targetPos.z - 0;
    const launchAzimuth = Math.atan2(dx, -dz);
    this.turretGroup.rotation.y = -launchAzimuth;
  }

  update(delta) {
    if (this.water) {
      this.water.update(delta);
    }
  }
}
