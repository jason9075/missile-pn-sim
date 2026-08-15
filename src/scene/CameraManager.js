import * as THREE from 'three';

export class CameraManager {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.mode = 'free'; // 'free' (or 'orbit'), 'missile-pov', 'missile-chase', 'target'

    // Free camera movement & rotation settings
    this.baseSpeed = 250; // meters per second
    this.boostMultiplier = 2.5;
    this.lookSpeed = 0.0024; // radians per pixel
    
    // Euler angles for free camera rotation ('YXZ' prevents gimbal roll)
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Movement key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      boost: false
    };

    // Velocity smoothing for fluid cinematic motion
    this.velocity = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();

    // Mouse / Touch drag state
    this.isDragging = false;
    this.prevPointerPos = { x: 0, y: 0 };

    // Chase Mode Orbit Controls (Azimuth, Elevation, Distance)
    this.chaseOrbit = {
      azimuth: 0,          // 0 = directly behind missile
      elevation: 0.32,     // ~18.3 degrees elevated above flight path
      distance: 40.0       // 40m orbit radius
    };

    // Target Mode Orbit Controls
    this.targetOrbit = {
      azimuth: 0.45,
      elevation: 0.28,
      distance: 35.0
    };

    this.bindEvents();
    this.resetCamera();
  }

  resetCamera() {
    this.camera.position.set(260, 180, 480);
    const target = new THREE.Vector3(50, 60, -200);
    this.camera.lookAt(target);
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.velocity.set(0, 0, 0);
    this.targetVelocity.set(0, 0, 0);

    this.chaseOrbit.azimuth = 0;
    this.chaseOrbit.elevation = 0.32;
    this.chaseOrbit.distance = 40.0;

    this.targetOrbit.azimuth = 0.45;
    this.targetOrbit.elevation = 0.28;
    this.targetOrbit.distance = 35.0;
  }

  // Alias for backward compatibility
  resetOrbit() {
    this.resetCamera();
  }

  setMode(mode) {
    this.mode = (mode === 'orbit') ? 'free' : mode;
    
    if (this.mode === 'free') {
      // Sync euler angles seamlessly from current camera quaternion
      this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.velocity.set(0, 0, 0);
      this.targetVelocity.set(0, 0, 0);
    }
  }

  bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.clearKeys());

    // Mouse / Touch events on domElement
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    window.addEventListener('pointercancel', () => this.onPointerUp());

    // Mouse wheel zoom
    this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  onKeyDown(event) {
    if (this.mode !== 'free') return;

    // Ignore key events when typing in inputs/modals
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    let handled = true;
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'KeyE':
      case 'Space':
        this.keys.up = true;
        break;
      case 'KeyQ':
      case 'KeyC':
        this.keys.down = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = true;
        break;
      default:
        handled = false;
        break;
    }

    if (handled && event.code.startsWith('Arrow')) {
      event.preventDefault();
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'KeyE':
      case 'Space':
        this.keys.up = false;
        break;
      case 'KeyQ':
      case 'KeyC':
        this.keys.down = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = false;
        break;
    }
  }

  clearKeys() {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
  }

  onPointerDown(event) {
    this.isDragging = true;
    this.prevPointerPos = { x: event.clientX, y: event.clientY };

    if (this.mode === 'free') {
      this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    }
  }

  onPointerMove(event) {
    if (!this.isDragging) return;

    const dx = event.clientX - this.prevPointerPos.x;
    const dy = event.clientY - this.prevPointerPos.y;
    this.prevPointerPos = { x: event.clientX, y: event.clientY };

    if (this.mode === 'free') {
      // Yaw (left / right rotation around world Y axis)
      this.euler.y -= dx * this.lookSpeed;
      
      // Pitch (up / down rotation around local X axis)
      this.euler.x -= dy * this.lookSpeed;

      // Clamp pitch angle to avoid camera flipping at zenith/nadir
      const maxPitch = Math.PI * 0.485; // ~87.3 degrees
      this.euler.x = Math.max(-maxPitch, Math.min(maxPitch, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);
    } else if (this.mode === 'missile-chase') {
      // 360 Orbit rotation around missile in flight
      this.chaseOrbit.azimuth += dx * 0.0055;
      this.chaseOrbit.elevation += dy * 0.0055;

      // Clamp elevation angle (-40 to +82 degrees)
      const minEl = -Math.PI * 0.22;
      const maxEl = Math.PI * 0.45;
      this.chaseOrbit.elevation = Math.max(minEl, Math.min(maxEl, this.chaseOrbit.elevation));
    } else if (this.mode === 'target') {
      // Orbit rotation around target drone
      this.targetOrbit.azimuth += dx * 0.0055;
      this.targetOrbit.elevation += dy * 0.0055;

      const minEl = -Math.PI * 0.22;
      const maxEl = Math.PI * 0.45;
      this.targetOrbit.elevation = Math.max(minEl, Math.min(maxEl, this.targetOrbit.elevation));
    }
  }

  onPointerUp() {
    this.isDragging = false;
  }

  onWheel(event) {
    event.preventDefault();

    if (this.mode === 'free') {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const zoomStep = -Math.sign(event.deltaY) * 35;
      this.camera.position.addScaledVector(forward, zoomStep);

      // Prevent moving below ground level (y >= 1m)
      if (this.camera.position.y < 1.0) {
        this.camera.position.y = 1.0;
      }
    } else if (this.mode === 'missile-chase') {
      // Zoom orbit distance around missile
      this.chaseOrbit.distance += Math.sign(event.deltaY) * 4.0;
      this.chaseOrbit.distance = Math.max(10.0, Math.min(220.0, this.chaseOrbit.distance));
    } else if (this.mode === 'target') {
      // Zoom orbit distance around target
      this.targetOrbit.distance += Math.sign(event.deltaY) * 3.5;
      this.targetOrbit.distance = Math.max(8.0, Math.min(180.0, this.targetOrbit.distance));
    }
  }

  update(missilePhysics, targetPhysics, delta = 1 / 60) {
    const dt = Math.min(delta, 0.1);

    if (this.mode === 'free') {
      // 1. Calculate direction vectors from camera orientation
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const worldUp = new THREE.Vector3(0, 1, 0); // World vertical axis for Q / E

      const moveDir = new THREE.Vector3(0, 0, 0);

      // WASD / Arrow directions
      if (this.keys.forward) moveDir.add(forward);
      if (this.keys.backward) moveDir.sub(forward);
      if (this.keys.right) moveDir.add(right);
      if (this.keys.left) moveDir.sub(right);

      // QE / Space / C vertical movements
      if (this.keys.up) moveDir.add(worldUp);
      if (this.keys.down) moveDir.sub(worldUp);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const speed = this.keys.boost ? (this.baseSpeed * this.boostMultiplier) : this.baseSpeed;
        this.targetVelocity.copy(moveDir).multiplyScalar(speed);
      } else {
        this.targetVelocity.set(0, 0, 0);
      }

      // Smooth inertia & damping
      const damping = 1 - Math.exp(-18 * dt);
      this.velocity.lerp(this.targetVelocity, damping);

      if (this.velocity.lengthSq() > 0.0001) {
        this.camera.position.addScaledVector(this.velocity, dt);

        // Ground constraint: prevent clipping under the ground plane
        if (this.camera.position.y < 1.0) {
          this.camera.position.y = 1.0;
        }
      }
    } else if (this.mode === 'missile-pov') {
      // Camera located right in front of missile nose seeker head, looking forward along missile orientation
      const noseOffset = new THREE.Vector3(0, 0, -5.2);
      noseOffset.applyQuaternion(missilePhysics.orientation);
      const camPos = missilePhysics.position.clone().add(noseOffset);
      
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(missilePhysics.orientation);
      const lookTarget = camPos.clone().addScaledVector(forward, 500);
      
      this.camera.position.copy(camPos);
      this.camera.lookAt(lookTarget);
    } else if (this.mode === 'missile-chase') {
      // Orbiting chase camera around missile in flight
      const forwardDir = missilePhysics.velocity.lengthSq() > 1e-3 
        ? missilePhysics.velocity.clone().normalize() 
        : new THREE.Vector3(0, 0, -1).applyQuaternion(missilePhysics.orientation);

      const worldUp = new THREE.Vector3(0, 1, 0);
      const rightDir = forwardDir.clone().cross(worldUp).normalize();
      // Ensure orthonormal up vector
      const orthoUp = rightDir.clone().cross(forwardDir).normalize();

      const cosEl = Math.cos(this.chaseOrbit.elevation);
      const sinEl = Math.sin(this.chaseOrbit.elevation);
      const cosAz = Math.cos(this.chaseOrbit.azimuth);
      const sinAz = Math.sin(this.chaseOrbit.azimuth);

      // Relative orbit offset from missile position
      const offset = new THREE.Vector3()
        .addScaledVector(forwardDir, -cosAz * cosEl * this.chaseOrbit.distance)
        .addScaledVector(rightDir, sinAz * cosEl * this.chaseOrbit.distance)
        .addScaledVector(orthoUp, sinEl * this.chaseOrbit.distance);

      const targetCamPos = missilePhysics.position.clone().add(offset);
      const lookTarget = missilePhysics.position.clone();

      this.camera.position.lerp(targetCamPos, 0.28);
      this.camera.lookAt(lookTarget);
    } else if (this.mode === 'target') {
      // Orbiting chase camera around target drone
      const forwardDir = targetPhysics.velocity.lengthSq() > 1e-3 
        ? targetPhysics.velocity.clone().normalize() 
        : new THREE.Vector3(0, 0, -1);

      const worldUp = new THREE.Vector3(0, 1, 0);
      const rightDir = forwardDir.clone().cross(worldUp).normalize();
      const orthoUp = rightDir.clone().cross(forwardDir).normalize();

      const cosEl = Math.cos(this.targetOrbit.elevation);
      const sinEl = Math.sin(this.targetOrbit.elevation);
      const cosAz = Math.cos(this.targetOrbit.azimuth);
      const sinAz = Math.sin(this.targetOrbit.azimuth);

      const offset = new THREE.Vector3()
        .addScaledVector(forwardDir, -cosAz * cosEl * this.targetOrbit.distance)
        .addScaledVector(rightDir, sinAz * cosEl * this.targetOrbit.distance)
        .addScaledVector(orthoUp, sinEl * this.targetOrbit.distance);

      const targetCamPos = targetPhysics.position.clone().add(offset);
      const lookTarget = targetPhysics.position.clone();

      this.camera.position.lerp(targetCamPos, 0.28);
      this.camera.lookAt(lookTarget);
    }
  }
}
