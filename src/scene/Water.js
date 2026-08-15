import * as THREE from 'three';

export class Water {
  constructor(options = {}) {
    this.width = options.width || 4500;
    this.length = options.length || 6000;
    this.time = 0;
    this.sunDirection = new THREE.Vector3(500, 1000, 500).normalize();

    this.initMesh();
  }

  initMesh() {
    const geometry = new THREE.PlaneGeometry(this.width, this.length, 128, 128);
    geometry.rotateX(-Math.PI / 2);

    const vertexShader = `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      // Gerstner wave function
      vec3 gerstnerWave(vec2 dir, float steepness, float wavelength, float speed, vec3 p, inout vec3 normal) {
        float k = 2.0 * 3.14159265 / wavelength;
        float c = sqrt(9.8 / k) * speed;
        vec2 d = normalize(dir);
        float f = k * (dot(d, p.xz) - c * uTime * 0.35);
        float a = steepness / k;

        normal.x -= d.x * (a * k * cos(f));
        normal.y -= steepness * sin(f);
        normal.z -= d.y * (a * k * cos(f));

        return vec3(
          d.x * (a * cos(f)),
          a * sin(f),
          d.y * (a * cos(f))
        );
      }

      void main() {
        vUv = uv;
        vec3 pos = position;
        vec3 normal = vec3(0.0, 1.0, 0.0);

        // Gentle multi-frequency light ocean waves
        vec3 wave1 = gerstnerWave(vec2(1.0, 0.35), 0.10, 110.0, 0.9, pos, normal);
        vec3 wave2 = gerstnerWave(vec2(0.5, 0.8), 0.07, 55.0, 1.1, pos, normal);
        vec3 wave3 = gerstnerWave(vec2(-0.4, 0.9), 0.04, 24.0, 1.3, pos, normal);

        pos += wave1 + wave2 + wave3;
        vWaveHeight = pos.y;

        normal = normalize(normal);
        vNormal = normal;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform vec3 uSunDirection;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFoamColor;
      uniform float uTime;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 normal = normalize(vNormal);

        // Fresnel reflection factor
        float fresnel = 0.05 + 0.95 * pow(1.0 - max(dot(viewDir, normal), 0.0), 3.5);

        // Specular sun glint
        vec3 reflectDir = reflect(-uSunDirection, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 96.0);
        vec3 sunHighlight = vec3(1.0, 0.98, 0.92) * spec * 1.6;

        // Wave crest foam
        float foam = smoothstep(0.4, 1.0, vWaveHeight);

        // Light blue gradient (淡藍色水體)
        vec3 waterColor = mix(uDeepColor, uShallowColor, clamp(vWaveHeight * 0.4 + 0.5, 0.0, 1.0));
        
        // Soft sky reflection
        vec3 skyReflection = vec3(0.80, 0.90, 0.96);
        vec3 finalColor = mix(waterColor, skyReflection, fresnel * 0.55);
        finalColor += sunHighlight;
        finalColor = mix(finalColor, uFoamColor, foam * 0.35);

        // Distance atmospheric fade
        float dist = length(cameraPosition - vWorldPosition);
        float fogFactor = clamp((dist - 1800.0) / 3200.0, 0.0, 0.5);
        vec3 fogColor = vec3(0.78, 0.86, 0.92);
        finalColor = mix(finalColor, fogColor, fogFactor);

        gl_FragColor = vec4(finalColor, 0.88);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: this.sunDirection },
        uDeepColor: { value: new THREE.Color(0x609bc2) },    // Tranquil Light Blue (淡藍色)
        uShallowColor: { value: new THREE.Color(0x9bd0e8) }, // Light Cyan / Sky Blue (淺水淡藍)
        uFoamColor: { value: new THREE.Color(0xf2f8fa) },    // Soft White Foam
      },
      transparent: true,
      depthWrite: false, // Ensure terrain beneath and around shore is rendered cleanly
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = 1; // Render water background before overlays and ribbon trails
    // Position over the sea/strait eastward from the coastline
    this.mesh.position.set(1600, 0.0, 0);
  }

  update(delta) {
    this.time += delta;
    if (this.material && this.material.uniforms) {
      this.material.uniforms.uTime.value = this.time;
    }
  }
}
