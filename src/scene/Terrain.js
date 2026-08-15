import * as THREE from 'three';

// Ground107 (Base Coastal Rock / Soil / Gravel)
import groundColorUrl from '../../assets/Ground107_1K-JPG_Color.jpg';
import groundNormalUrl from '../../assets/Ground107_1K-JPG_NormalGL.jpg';
import groundRoughnessUrl from '../../assets/Ground107_1K-JPG_Roughness.jpg';
import groundAoUrl from '../../assets/Ground107_1K-JPG_AmbientOcclusion.jpg';

// Ground037 (Sparse Grass / Meadow)
import grassColorUrl from '../../assets/Ground037_1K-JPG_Color.jpg';
import grassNormalUrl from '../../assets/Ground037_1K-JPG_NormalGL.jpg';
import grassRoughnessUrl from '../../assets/Ground037_1K-JPG_Roughness.jpg';
import grassAoUrl from '../../assets/Ground037_1K-JPG_AmbientOcclusion.jpg';

export class Terrain {
  constructor(options = {}) {
    this.size = options.size || 5500;
    this.segments = options.segments || 160;
    this.group = new THREE.Group();

    this.initTerrainMesh();
    this.initCoastalBaseRevetment();
  }

  // Procedural height field function evaluating coastal hillock, coastline, hills and strait islands
  getTerrainHeight(x, z) {
    // 1. Coastline contour curve
    const coastX = 110 + 42 * Math.sin(z * 0.0028) + 22 * Math.cos(z * 0.0065 + 0.8);
    
    // 2. Missile launcher hillock (凸地 / 小山丘) at (0, 0)
    const distFromLauncher = Math.hypot(x, z);
    const hillTopRadius = 28.0;   // Flat top plateau for the launcher platform
    const hillBaseRadius = 140.0; // Base footprint radius of the hillock
    const hillElevation = 22.0;   // 22 meters hill peak elevation

    let baseHeight = 0;

    if (x < coastX) {
      // Land side: background terrain elevation
      const landFactor = (coastX - x) / 100.0;
      const cliffHeight = Math.min(1.0, landFactor) * 8.0;
      
      const hillNoise = 
        34 * Math.sin(x * 0.0022 + z * 0.0016) * Math.cos(z * 0.002 - x * 0.0012) +
        22 * Math.sin(x * 0.0052 + 1.2) * Math.cos(z * 0.0038) +
        12 * Math.sin(x * 0.012 + z * 0.009) +
        6 * Math.cos(x * 0.024 - z * 0.02);

      const mountainFactor = Math.max(0, (-x - 100) / 320.0);
      const mountainHeight = Math.min(220, mountainFactor * 65 + Math.max(0, hillNoise) * (1 + mountainFactor * 0.85));

      baseHeight = cliffHeight + mountainHeight;
    } else {
      // Ocean / Strait side seabed
      const seaDist = x - coastX;
      baseHeight = -Math.min(45.0, seaDist * 0.22 + 6.0);
    }

    // Blend the prominent missile platform hillock smoothly into the surrounding terrain
    let finalHeight = baseHeight;

    if (distFromLauncher < hillTopRadius) {
      finalHeight = hillElevation;
    } else if (distFromLauncher < hillBaseRadius) {
      const t = (distFromLauncher - hillTopRadius) / (hillBaseRadius - hillTopRadius);
      const smooth = 0.5 * (1.0 + Math.cos(Math.PI * t)); // cosine bell curve 1 -> 0
      finalHeight = smooth * hillElevation + (1.0 - smooth) * baseHeight;
    }

    // Distant Strait Islands (if on sea side)
    if (x >= coastX) {
      const dIsland1 = Math.hypot(x - 1800, z + 300);
      let island1H = 0;
      if (dIsland1 < 550) {
        const t = 1.0 - dIsland1 / 550.0;
        const tSmooth = t * t * (3 - 2 * t);
        const noise = 22 * Math.sin(x * 0.01 + z * 0.012) + 12 * Math.cos(x * 0.02 - z * 0.018);
        island1H = tSmooth * (145 + noise);
      }

      const dIsland2 = Math.hypot(x - 2200, z - 1050);
      let island2H = 0;
      if (dIsland2 < 460) {
        const t = 1.0 - dIsland2 / 460.0;
        const tSmooth = t * t * (3 - 2 * t);
        const noise = 18 * Math.sin(x * 0.012 - z * 0.01) + 9 * Math.cos(x * 0.022 + z * 0.015);
        island2H = tSmooth * (120 + noise);
      }

      const dIsland3 = Math.hypot(x - 1650, z + 1450);
      let island3H = 0;
      if (dIsland3 < 420) {
        const t = 1.0 - dIsland3 / 420.0;
        const tSmooth = t * t * (3 - 2 * t);
        island3H = tSmooth * (95 + 16 * Math.sin(x * 0.015 + z * 0.01));
      }

      const dIsland4 = Math.hypot(x - 750, z - 420);
      let island4H = 0;
      if (dIsland4 < 240) {
        const t = 1.0 - dIsland4 / 240.0;
        const tSmooth = t * t * (3 - 2 * t);
        island4H = tSmooth * 48;
      }

      const maxIsland = Math.max(island1H, island2H, island3H, island4H);
      if (maxIsland > 0) {
        finalHeight = Math.max(finalHeight, baseHeight + maxIsland);
      }
    }

    return finalHeight;
  }

  initTerrainMesh() {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const vertexCount = positions.count;
    const colors = new Float32Array(vertexCount * 3);

    // Apply procedural heightfield
    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = this.getTerrainHeight(x, z);
      positions.setY(i, y);
    }

    // Recompute accurate surface normals
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;

    // UV2 for ambient occlusion map support
    geometry.setAttribute('uv2', geometry.attributes.uv.clone());

    // Natural geographic biome tint colors
    const cDeepSea = new THREE.Color(0x354b60);     // Underwater seabed
    const cBeach = new THREE.Color(0xdad0bc);       // Shoreline sandy gravel
    const cCliffRock = new THREE.Color(0x768396);    // Steep coastal cliff
    const cDarkRock = new THREE.Color(0x566070);     // Vertical rock face
    const cGrass = new THREE.Color(0x82a678);        // Subtropical coastal grassland
    const cHighGrass = new THREE.Color(0x68885f);    // Mountain slope foliage
    const cMountainRock = new THREE.Color(0x8291a4); // Slate peak rock
    const cBaseConcrete = new THREE.Color(0x6b7787); // Missile base pad concrete

    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const ny = normals.getY(i); // 1 = flat, 0 = vertical

      let col = new THREE.Color();
      const distFromBase = Math.hypot(x, z);

      if (distFromBase < 32) {
        // Base plateau area
        const blend = Math.min(1.0, Math.max(0.0, (distFromBase - 22) / 10.0));
        col.copy(cBaseConcrete).lerp(cGrass, blend);
      } else if (distFromBase < 140) {
        // Slopes of the missile platform hillock
        if (ny < 0.68) {
          col.copy(cCliffRock);
        } else {
          col.copy(cGrass);
        }
      } else if (y < -1.5) {
        // Underwater seabed
        const t = Math.min(1.0, Math.max(0.0, (y + 35.0) / 33.5));
        col.copy(cDeepSea).lerp(cBeach, t);
      } else if (y < 3.5) {
        // Shoreline / Beach
        const t = (y + 1.5) / 5.0;
        col.copy(cBeach).lerp(cGrass, t);
      } else {
        // Above sea level terrain
        if (ny < 0.62) {
          // Steep cliff face
          col.copy(cDarkRock);
        } else if (ny < 0.82) {
          // Moderate rocky slope
          const t = (ny - 0.62) / 0.20;
          col.copy(cCliffRock).lerp(cHighGrass, t);
        } else {
          // Flat / rolling grassland & hills
          if (y < 75) {
            col.copy(cGrass);
          } else {
            const t = Math.min(1.0, (y - 75) / 90.0);
            col.copy(cHighGrass).lerp(cMountainRock, t);
          }
        }
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Load PBR Texture Sets
    const textureLoader = new THREE.TextureLoader();

    // 1. Ground107 (Base rock / soil / coastal ground)
    const groundRepeat = 52.0;
    const groundColorTex = textureLoader.load(groundColorUrl);
    groundColorTex.wrapS = THREE.RepeatWrapping;
    groundColorTex.wrapT = THREE.RepeatWrapping;
    groundColorTex.repeat.set(groundRepeat, groundRepeat);
    groundColorTex.colorSpace = THREE.SRGBColorSpace;

    const groundNormalTex = textureLoader.load(groundNormalUrl);
    groundNormalTex.wrapS = THREE.RepeatWrapping;
    groundNormalTex.wrapT = THREE.RepeatWrapping;
    groundNormalTex.repeat.set(groundRepeat, groundRepeat);

    const groundRoughnessTex = textureLoader.load(groundRoughnessUrl);
    groundRoughnessTex.wrapS = THREE.RepeatWrapping;
    groundRoughnessTex.wrapT = THREE.RepeatWrapping;
    groundRoughnessTex.repeat.set(groundRepeat, groundRepeat);

    const groundAoTex = textureLoader.load(groundAoUrl);
    groundAoTex.wrapS = THREE.RepeatWrapping;
    groundAoTex.wrapT = THREE.RepeatWrapping;
    groundAoTex.repeat.set(groundRepeat, groundRepeat);

    // 2. Ground037 (Sparse Grass / Meadow)
    const grassRepeat = 68.0;
    const grassColorTex = textureLoader.load(grassColorUrl);
    grassColorTex.wrapS = THREE.RepeatWrapping;
    grassColorTex.wrapT = THREE.RepeatWrapping;
    grassColorTex.repeat.set(grassRepeat, grassRepeat);
    grassColorTex.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshStandardMaterial({
      map: groundColorTex,
      normalMap: groundNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: groundRoughnessTex,
      aoMap: groundAoTex,
      aoMapIntensity: 0.8,
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
    });

    // Custom shader modification for organic fractal FBM noise splatting + stochastic anti-tiling
    material.customProgramCacheKey = () => 'terrain_fbm_dual_texture_v5';

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGrassMap = { value: grassColorTex };
      shader.uniforms.uGrassRepeat = { value: grassRepeat / groundRepeat };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vTerrainWorldPos;
        varying vec3 vTerrainNormal;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vTerrainWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vTerrainNormal = normalize(normalMatrix * normal);
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform sampler2D uGrassMap;
        uniform float uGrassRepeat;
        varying vec3 vTerrainWorldPos;
        varying vec3 vTerrainNormal;

        // 2D Gradient Noise Generator
        vec2 terrainHash22(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float terrainNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(dot(terrainHash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                dot(terrainHash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
            mix(dot(terrainHash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                dot(terrainHash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        // Fractal Brownian Motion (FBM) for non-periodic organic landscape patterns
        float terrainFBM(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
          for (int i = 0; i < 4; i++) {
            v += a * terrainNoise(p);
            p = rot * p * 2.02 + vec2(31.4, 17.8);
            a *= 0.5;
          }
          return v;
        }

        // Dual-Scale rotated stochastic sampling to eliminate wallpaper tiling
        vec4 sampleGroundPBR(sampler2D tex, vec2 uv, vec2 worldXZ) {
          vec2 uv1 = uv;
          vec2 uv2 = mat2(0.866, -0.5, 0.5, 0.866) * uv * 1.33 + vec2(0.31, 0.67);
          float blend = 0.5 + 0.5 * terrainNoise(worldXZ * 0.015);
          return mix(texture2D(tex, uv1), texture2D(tex, uv2), blend * 0.45);
        }

        vec4 sampleGrassPBR(sampler2D tex, vec2 uv, vec2 worldXZ) {
          vec2 uv1 = uv;
          vec2 uv2 = mat2(0.707, 0.707, -0.707, 0.707) * uv * 1.37 + vec2(0.19, 0.53);
          float blend = 0.5 + 0.5 * terrainNoise(worldXZ * 0.02 + vec2(15.0, -8.0));
          return mix(texture2D(tex, uv1), texture2D(tex, uv2), blend * 0.45);
        }

        float computeSparseGrassWeight(vec3 worldPos, vec3 normal) {
          // 1. Slope factor: gentle slopes & plateau get lush grass (normal.y > 0.72), steep cliffs stay rocky (normal.y < 0.62)
          float slopeFactor = smoothstep(0.62, 0.80, normal.y);

          // 2. Altitude factor: grass grows above sea level (y > 2.0m)
          float altFactor = smoothstep(1.5, 5.0, worldPos.y);

          // 3. Multi-scale Organic FBM noise (non-periodic, irregular natural clumping)
          float macroNoise = terrainFBM(worldPos.xz * 0.005);          // ~200m broad biome patches
          float clumpNoise = terrainFBM(worldPos.xz * 0.022 + vec2(47.0, -29.0)); // ~45m natural clumps
          float microNoise = terrainNoise(worldPos.xz * 0.07);         // ~14m edge detailing

          float combinedNoise = macroNoise * 0.60 + clumpNoise * 0.30 + microNoise * 0.10;
          float grassMask = smoothstep(-0.12, 0.28, combinedNoise);

          // 4. Base plateau clearance (revetment platform is kept clear of wild grass)
          float distFromLauncher = length(worldPos.xz);
          float baseClearance = smoothstep(22.0, 36.0, distFromLauncher);

          return slopeFactor * altFactor * grassMask * baseClearance;
        }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP
          vec4 texelGround = sampleGroundPBR(map, vMapUv, vTerrainWorldPos.xz);
          vec4 texelGrass = sampleGrassPBR(uGrassMap, vMapUv * uGrassRepeat, vTerrainWorldPos.xz);

          float grassWeight = computeSparseGrassWeight(vTerrainWorldPos, vTerrainNormal);

          vec4 blendedTexel = mix(texelGround, texelGrass, grassWeight);
          diffuseColor *= blendedTexel;
        #endif
        `
      );
    };

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);
  }

  initCoastalBaseRevetment() {
    const hillElevation = 22.0;

    // Fortified Octagonal Concrete Platform Foundation atop the hillock
    const platformGeo = new THREE.CylinderGeometry(26, 28, 2.5, 8);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x2e3440,
      roughness: 0.7,
      metalness: 0.3,
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.set(0, hillElevation + 1.2, 0);
    platformMesh.receiveShadow = true;
    platformMesh.castShadow = true;
    this.group.add(platformMesh);

    // Hazard Border Ring
    const borderGeo = new THREE.RingGeometry(23.5, 25.5, 8);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xd08770, // Tactical Orange/Yellow Hazard
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.rotation.x = -Math.PI / 2;
    borderMesh.position.set(0, hillElevation + 2.48, 0);
    this.group.add(borderMesh);

    // Blast Deflector Seawall facing the ocean (towards +X)
    const wallGeo = new THREE.BoxGeometry(5, 3.5, 28);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x434c5e,
      roughness: 0.8,
    });
    const seawall = new THREE.Mesh(wallGeo, wallMat);
    seawall.position.set(25, hillElevation + 1.8, 0);
    seawall.receiveShadow = true;
    seawall.castShadow = true;
    this.group.add(seawall);

    // Coastal Warning & Communication Mast
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.5, 18, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.8, roughness: 0.2 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(-18, hillElevation + 9, 16);
    this.group.add(mast);

    // Beacon Light on top of mast
    const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xebcb8b });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(-18, hillElevation + 18, 16);
    this.group.add(beacon);
  }
}
