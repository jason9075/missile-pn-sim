# Proportional Navigation (PN) Missile Interception Simulation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r163-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![NixOS](https://img.shields.io/badge/Nix-Flake-5277C3?logo=nixos)](https://nixos.org/)

An interactive, high-fidelity 3D WebGL tactical simulation of **Proportional Navigation (PN / TPN) Guidance Law** for surface-to-air missile interception against incoming aerial threats (Shahed-136 delta-wing suicide drones).

Built with **Three.js**, **KaTeX**, **Prism.js**, and vanilla CSS/JavaScript in a reproducible **NixOS Flake** environment.

---

## 🌟 Key Features

* **3D True Proportional Navigation (TPN) Engine**:
  * Real-time 3D vector guidance mathematics computing Line-of-Sight (LOS) angular velocity ($\boldsymbol{\omega}_{\text{los}}$) and closing velocity ($V_c$).
  * Dynamic transverse acceleration normal to missile velocity vector ($\mathbf{a}_c \perp \mathbf{u}_m$).
  * Configurable navigation constant ($N = 1.0 \sim 6.0$) and aerodynamic G-limit saturation ($a_{\max} = 30\text{ G}$).
* **Tactical Threat Flight Corridors**:
  * **`Coastline Crossing` (Lateral / Flank Interception)**: Target cruises straight north along the coastline, creating high LOS rotation rates ($\dot{\lambda}$) and demonstrating classical curved proportional pursuit lead geometry.
  * **`Direct Inbound` (Head-on / Frontal Interception)**: High-speed head-on approach across the strait ($\sim 580\text{ m/s}$ relative closing speed).
  * **`Beam Crossing` (Pure 90° Flank)**: Beam point placed on the launch bearing at $d = 1575\text{ m}$, so the track is perpendicular to the fixed rail in plan view — and, being horizontal and sharing the rail's azimuth, at exactly $90^\circ$ to the missile nose in 3D as well. The threat spawns $600\text{ m}$ upstream at a $69^\circ$ aspect and sweeps across the boresight $3.33\text{ s}$ later, so there is a run-in to watch before committing. Because it crosses *toward* the fixed rail, the $20.9^\circ$ of azimuth error is really a free lead angle — PN barely touches the rudder ($2.3\text{ G}$ yaw against $15.4\text{ G}$ pitch) and the miss distance lands at $7.0\text{ m}$ inside the $12\text{ m}$ fuze.
* **Co-linear Launcher Turret & Dynamic Aiming**:
  * Quad-tube container launcher battery positioned on the island fortress. The rail is **fixed** at $58^\circ$ azimuth and $+45^\circ$ elevation and does not slew, so every engagement opens with a built-in heading error ($32^\circ$ head-on, up to $74^\circ$ on the flank corridor) that proportional navigation has to work off.
* **Proximity Fuze & Combat Damage States**:
  * **Proximity Fuze ($12.0\text{m}$ Lethal Radius)**: Senses target proximity and triggers warhead detonation, eliminating discrete time-step skipping.
  * **Tactical Hologram Meshes**: Interception freezes the engagement point with **Translucent Cyan/Blue Ghost Mesh** for the missile and **Translucent Crimson Red Ghost Mesh** for the intercepted drone, alongside explosive fragmentation particles.
* **Real-time 3D Ribbon Trajectories & Visual Overlays**:
  * Solid 3D Ribbon Trajectory Meshes ($2.2\text{m}$ width): **Emerald Green (`#32D74B`)** for friendly missile, **Crimson Red (`#FF3B56`)** for hostile target.
  * Real-time dynamic vector overlays for LOS Line, Acceleration Command ($\mathbf{a}_c$), and Target Velocity.
* **Multi-Camera Tracking & 360° Orbit**:
  * **Missile Chase View**: Tracks the missile in flight with interactive full 360° mouse drag azimuth/elevation orbit and wheel zooming.
  * **Target Tracking View**: Clamped focus on the approaching threat.
  * **Launcher Battery & Base Fortress Views**: Ground-level perspective of rocket launches.
* **Bilingual Mathematical Knowledge Modal**:
  * Section-by-section mathematical derivations rendered with KaTeX.
  * Interactive language toggle between English and Traditional Chinese (繁體中文).
  * Comprehensive analysis of Proportional Navigation, maneuver saturation, and Proximity Fuze vs. Hit-to-Kill mechanics.
* **PBR Island & Custom Gerstner Ocean Shaders**:
  * Photorealistic cliff terrains with Ambient Occlusion, Roughness, Normal, and Color maps.
  * Multi-harmonic Gerstner wave ocean surface with Fresnel sky reflections and specular sun glint.

---

## 📐 Guidance Mathematics & Physics

### 1. Line-of-Sight (LOS) & Closing Velocity
Given missile position $\mathbf{r}_m$, velocity $\mathbf{v}_m$, target position $\mathbf{r}_t$, and velocity $\mathbf{v}_t$:

$$\mathbf{r} = \mathbf{r}_t - \mathbf{r}_m, \quad R = \|\mathbf{r}\|, \quad \mathbf{u}_{los} = \frac{\mathbf{r}}{R}$$

$$\mathbf{v}_r = \mathbf{v}_t - \mathbf{v}_m, \quad V_c = -\dot{R} = -\frac{\mathbf{r} \cdot \mathbf{v}_r}{R}$$

$$\boldsymbol{\omega}_{los} = \frac{\mathbf{r} \times \mathbf{v}_r}{R^2}$$

### 2. 3D True Proportional Navigation (TPN) Command
The transverse guidance acceleration command $\mathbf{a}_c$ commanded to the missile autopilot is:

$$\mathbf{a}_c = N \cdot V_c \cdot (\boldsymbol{\omega}_{los} \times \mathbf{u}_m)$$

where:
* $N$ is the dimensionless Navigation Gain Constant (typically $3.0 \sim 5.0$).
* $\mathbf{u}_m = \mathbf{v}_m / \|\mathbf{v}_m\|$ is the missile forward velocity unit vector.
* $\|\mathbf{a}_c\| \le a_{\max} = 30\text{ G}$ ($294.3\text{ m/s}^2$).

### 3. Sensor Observability & Real-world Seeker Physics
In simulation environments, the engine computes $\boldsymbol{\omega}_{los}$ and $V_c$ using ground-truth positions ($\mathbf{r}_t, \mathbf{r}_m$) and velocities ($\mathbf{v}_t, \mathbf{v}_m$). In real-world combat, the interceptor **does not know and has no need for** the target's absolute coordinate or ground speed:

* **Closing Velocity ($V_c = -\dot{R}$)**: Directly measured by the active/semi-active RF seeker via **Doppler frequency shift** of the reflected echo:
  $$\Delta f_d = \frac{2 V_c}{\lambda} = \frac{2 f_0 V_c}{c}$$
  eliminating the need to know the target's independent airspeed or heading.
* **LOS Angular Rate Vector ($\boldsymbol{\omega}_{los} = \dot{\boldsymbol{\lambda}}$)**: Measured directly in inertial space by the seeker's **rate gyroscopes** mounted on the gimballed antenna/optical tracker.
* **Missile Unit Heading ($\mathbf{u}_m$)**: Measured by the onboard **Inertial Navigation System (INS / IMU)**.

#### 📊 Variable Derivation: Simulation (Ground Truth) vs. Real-world Missile Hardware

| Parameter / Term | Symbol | How Simulation Computes It (This Project) | How Real Missiles Obtain It (Physical Sensors) |
| :--- | :---: | :--- | :--- |
| **Navigation Gain** | $N$ | Preset UI slider parameter ($N = 2.0 \sim 6.0$, default $4.0$) | Hardcoded / scheduled in missile Guidance Computer (GCU, $N = 3 \sim 5$) |
| **Closing Velocity** | $V_c$ | Calculated from ground-truth states:<br>$V_c = - \frac{(\mathbf{r}_t - \mathbf{r}_m) \cdot (\mathbf{v}_t - \mathbf{v}_m)}{\|\mathbf{r}_t - \mathbf{r}_m\|}$ | **Doppler Frequency Shift** measured by radar seeker:<br>$\Delta f_d = \frac{2 V_c}{\lambda}$ (or pulse radar range-rate $\Delta R / \Delta t$) |
| **LOS Angular Rate** | $\boldsymbol{\omega}_{los}$ | Calculated from vector kinematics:<br>$\boldsymbol{\omega}_{los} = \frac{\mathbf{r} \times \mathbf{v}_r}{R^2}$ | Directly measured in inertial space by **Rate Gyroscopes** on the gimballed seeker antenna, or optical seeker angle-rate + IMU ($\boldsymbol{\omega}_{\text{body}} + \dot{\boldsymbol{\theta}}_{\text{pixel}}$) |
| **Missile Heading** | $\mathbf{u}_m$ | Normalized missile velocity vector:<br>$\mathbf{u}_m = \mathbf{v}_m / \|\mathbf{v}_m\|$ | Measured by onboard **Inertial Navigation System (INS / IMU)** from missile integration |
| **Raw Accel Command** | $\mathbf{a}_c$ ($\mathbf{a}_{cmd}$) | Vector formula in `VectorMath.js`:<br>$\mathbf{a}_c = N \cdot V_c \cdot (\boldsymbol{\omega}_{los} \times \mathbf{u}_m)$ | Computed by Guidance Computer (GCU / DSP) combining seeker signals ($V_c, \boldsymbol{\omega}_{los}$) and INS ($\mathbf{u}_m$) |
| **G-Limit Saturation** | $a_{\max}, \mathbf{a}_m$ | Vector magnitude clamped by `maxAccelG * G0` with dynamic pressure $q$-scaling | Physical aerodynamic lift limit ($L_{\max} = \frac{1}{2}\rho V^2 S C_{L,\max}$) and control fin mechanical limit |
| **Target State** | $\mathbf{r}_t, \mathbf{v}_t$ | Directly known from simulation engine (tagged as `[GOD]` in HUD) | **Unknown & Unneeded** — PN guidance achieves intercept purely through relative observables |

Because Proportional Navigation relies exclusively on these locally observable quantities, it operates entirely self-contained without requiring target GPS coordinates or external datalinks.

### 4. Proximity Fuze Warhead Lethality
Unlike kinetic hit-to-kill systems, air defense missiles utilize active laser/RF proximity fuzes detonating at $R \le 12\text{ m}$:

$$P_k = 1 - \exp\left(-\frac{N_f \cdot A_t}{4\pi R^2}\right)$$

where $N_f$ is the fragment count ($2,000 \sim 3,000$ pellets at $2,500\text{ m/s}$) and $A_t$ is target vulnerable area.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+) & [npm](https://www.npmjs.com/)
* Optional: [Nix](https://nixos.org/) with Flakes enabled, or [Just](https://github.com/casey/just) command runner.

### 1. Clone the Repository
```bash
git clone https://github.com/jason9075/missile-pn-sim.git
cd missile-pn-sim
```

### 2. Running with Nix (Recommended on NixOS)
```bash
nix develop
just dev
```

### 3. Running with Standard npm
```bash
# Install dependencies
npm install --ignore-scripts

# Start local dev server (port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open your browser at `http://localhost:8080/`.

---

## 🎮 Controls & Interface

| Control | Description |
| :--- | :--- |
| **🚀 Launch** | Fire the interceptor missile from the battery launcher. |
| **⏸ Pause / Resume** | Pause or resume the physics simulation. |
| **⏭ Step Once** | Advance physics step by one frame ($\Delta t = 16.6\text{ ms}$). |
| **🔄 Reset** | Reset missile and target to initial standby state and re-aim launcher. |
| **📷 Camera Modes** | Switch between Free Orbit, Missile Chase, Target Tracking, Base, and Launcher. |
| **⚙️ Sim Settings** | Adjust Navigation Constant ($N$), Missile Speed, Target Speed, and Target Flight Corridor. |
| **👁️ Visual Overlays** | Toggle Line-of-Sight (LOS) line, Accel Command vector, Velocity arrow, and Ribbon Trails. |
| **📖 Knowledge Modal** | Open the interactive bilingual guidance mathematics theory popup. |

---

## 📂 Project Structure

```
├── assets/                  # 1K PBR ground textures & citrus orchard sky HDR
├── scripts/                 # NixOS noexec compatibility wrapper
├── src/
│   ├── main.js              # Application entry, loop, and component orchestration
│   ├── style.css            # Tactical military dark glassmorphism styling
│   ├── physics/
│   │   ├── Missile.js       # 3D kinematic missile physics & proximity fuze
│   │   ├── Target.js        # Shahed-136 drone flight kinematics & preset routes
│   │   └── PNController.js  # 3D True Proportional Navigation guidance algorithm
│   ├── scene/
│   │   ├── CameraManager.js # Camera perspectives & 360° chase orbit controller
│   │   ├── Environment.js   # PBR island terrain, launcher turret battery, lighting
│   │   ├── MissileModel.js  # 3D missile model, flame plume, vector helpers
│   │   ├── TargetModel.js   # 3D Shahed-136 delta wing, propeller animation
│   │   ├── RibbonTrail.js   # 3D solid ribbon trajectory mesh generator
│   │   └── Water.js         # Gerstner multi-harmonic ocean GLSL shader
│   └── ui/
│       ├── Controls.js      # Toolbar, sidebar, and sliders event binding
│       ├── TelemetryPanel.js# Live HUD telemetry monitor
│       └── MathModal.js     # Bilingual KaTeX + Prism guidance theory modal
├── flake.nix                # NixOS development environment flake
├── Justfile                 # Task runner recipes
├── index.html               # Main HTML layout
└── package.json
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

Copyright (c) 2026 **Jason Kuan ([@jason9075](https://github.com/jason9075))**.
