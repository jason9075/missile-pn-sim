import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import hdrUrl from '../../assets/citrus_orchard_road_puresky_1k.hdr';
import { Terrain } from './Terrain.js';
import { Water } from './Water.js';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.initEnvironment();
    this.initTerrainAndWater();
    this.initLauncher();
    this.loadSkybox();
  }

  loadSkybox() {
    new RGBELoader().load(
      hdrUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture;
        this.scene.environment = texture;
        // Soft atmospheric fog matching the strait horizon
        this.scene.fog = new THREE.FogExp2(0xb8c9d9, 0.00007);
      },
      undefined,
      (err) => {
        console.warn('Failed to load HDR skybox:', err);
      }
    );
  }

  initEnvironment() {
    // Initial fallback background color matching Nord theme
    this.scene.background = new THREE.Color(0x2E3440);
    this.scene.fog = new THREE.FogExp2(0x2E3440, 0.0003);

    // Tactical distance rings around coastal air defense launcher (every 500m)
    const ringGroup = new THREE.Group();
    const distances = [500, 1000, 1500, 2000];
    distances.forEach((r) => {
      const ringGeo = new THREE.RingGeometry(r - 1.8, r + 1.8, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x88c0d0,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.5;
      ringGroup.add(ringMesh);
    });
    this.scene.add(ringGroup);

    // Sun & Ambient Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xd8dee9, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    dirLight.position.set(500, 1000, 500);
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
    this.water = new Water({ size: 6000 });
    this.scene.add(this.water.mesh);
  }

  initLauncher() {
    this.launcherGroup = new THREE.Group();
    this.launcherGroup.position.set(0, 22.0, 0);

    // Concrete Base Platform
    const baseGeo = new THREE.BoxGeometry(24, 4, 24);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3B4252, roughness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.launcherGroup.add(baseMesh);

    // Rotating Turret Platform
    const turretGeo = new THREE.CylinderGeometry(8, 9, 3, 16);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x434C5E, metalness: 0.5, roughness: 0.4 });
    const turretMesh = new THREE.Mesh(turretGeo, turretMat);
    turretMesh.position.y = 5.5;
    turretMesh.castShadow = true;
    turretMesh.receiveShadow = true;
    this.launcherGroup.add(turretMesh);

    // Missile Launch Tubes (Quad Launcher Assembly)
    const tubeGroup = new THREE.Group();
    tubeGroup.position.set(0, 8, 0);
    tubeGroup.rotation.x = -Math.PI / 4; // 45 degree launch angle

    const tubeGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 16);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x4C566A, metalness: 0.7, roughness: 0.3 });

    const offsets = [
      [-2.5, 2.5], [2.5, 2.5],
      [-2.5, -2.5], [2.5, -2.5]
    ];

    offsets.forEach(([x, z]) => {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(x, 0, z);
      tube.castShadow = true;
      tube.receiveShadow = true;
      tubeGroup.add(tube);
    });

    this.launcherGroup.add(tubeGroup);

    // Radar Mast
    const radarMastGeo = new THREE.CylinderGeometry(0.5, 0.8, 10, 8);
    const radarMast = new THREE.Mesh(radarMastGeo, turretMat);
    radarMast.position.set(0, 10, -5);
    radarMast.castShadow = true;
    this.launcherGroup.add(radarMast);

    const radarDishGeo = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    const radarDishMat = new THREE.MeshStandardMaterial({ color: 0x88C0D0, side: THREE.DoubleSide, metalness: 0.8 });
    const radarDish = new THREE.Mesh(radarDishGeo, radarDishMat);
    radarDish.position.set(0, 15, -5);
    radarDish.rotation.x = Math.PI / 6;
    radarDish.castShadow = true;
    this.launcherGroup.add(radarDish);

    this.scene.add(this.launcherGroup);
  }

  update(delta) {
    if (this.water) {
      this.water.update(delta);
    }
  }
}
