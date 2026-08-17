import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript.js';
import 'prism-themes/themes/prism-nord.css';

export class MathModal {
  constructor() {
    this.openBtn = document.getElementById('open-math');
    this.closeBtn = document.getElementById('close-math');
    this.langBtn = document.getElementById('language-toggle');
    this.modal = document.getElementById('math-modal');
    this.content = document.getElementById('math-content');

    this.language = localStorage.getItem('missile_sim_lang') || 'zhTW'; // Default to Traditional Chinese

    this.modalCopy = {
      en: `
        <h3>1. Proportional Navigation Guidance Law (PN)</h3>
        <p>Proportional Navigation (PN) is a proven homing guidance law used by modern air defense missiles. The fundamental principle is to command a lateral acceleration proportional to the Line-of-Sight (LOS) rotation rate $\\dot{\\lambda}$ and the closing velocity $V_c$.</p>
        
        <h3>2. Kinematics & LOS Spherical Geometry</h3>
        <p>Let $\\mathbf{r}_m = (x_m, y_m, z_m)$ and $\\mathbf{v}_m$ be the missile position and velocity, and $\\mathbf{r}_t = (x_t, y_t, z_t)$ and $\\mathbf{v}_t$ be those of the target.</p>
        
        <p><strong>Line-of-Sight (LOS) Vector:</strong></p>
        <p>$$\\mathbf{r} = \\mathbf{r}_t - \\mathbf{r}_m = (r_x, r_y, r_z), \\quad R = \\|\\mathbf{r}\\|, \\quad \\mathbf{u}_{los} = \\frac{\\mathbf{r}}{R}$$</p>

        <p><strong>LOS Azimuth & Elevation Angles (Horizontal Yaw & Vertical Pitch):</strong></p>
        <p>In 3D spherical coordinates relative to the inertial ground frame:</p>
        <ul>
          <li>
            <strong>Azimuth Angle (方位角 / Horizontal Yaw $\\psi_{los}$):</strong>
            $$\\psi_{los} = \\text{atan2}(r_x, -r_z) \\in [0^\\circ, 360^\\circ)$$
            Represents the horizontal compass bearing of the target across the $X$-$Z$ ground plane.
          </li>
          <li>
            <strong>Elevation Angle (俯仰角 / Vertical Pitch $\\theta_{los}$):</strong>
            $$\\theta_{los} = \\arcsin\\left(\\frac{r_y}{R}\\right) \\in [-90^\\circ, +90^\\circ]$$
            Represents the vertical elevation angle of the target above or below the horizontal ground plane.
          </li>
        </ul>
        <p><em>*Note on terminology:</em> While body attitude uses body-fixed Euler angles ($\text{Yaw}, \\text{Pitch}, \\text{Roll}$) to describe where the missile's nose points, LOS $\\text{Azimuth}$ and $\\text{Elevation}$ describe where the target is located in space relative to the missile seeker.</p>
        
        <p><strong>Relative Velocity & Closing Velocity ($V_c$):</strong></p>
        <p>$$\\mathbf{v}_r = \\mathbf{v}_t - \\mathbf{v}_m, \\quad V_c = -\\dot{R} = -\\frac{\\mathbf{r} \\cdot \\mathbf{v}_r}{R}$$</p>
        
        <p><strong>3D LOS Rate Vector Calculation ($\\boldsymbol{\\omega}_{los}$):</strong></p>
        <p>The Line-of-Sight angular velocity vector $\\boldsymbol{\\omega}_{los}$ accounts for <b>both horizontal and vertical rotation simultaneously</b> via the 3D cross product:</p>
        <p>$$\\boldsymbol{\\omega}_{los} = \\frac{\\mathbf{r} \\times \\mathbf{v}_r}{R^2} = \\begin{bmatrix} \\omega_x \\\\ \\omega_y \\\\ \\omega_z \\end{bmatrix}$$</p>
        <p><strong>Total LOS Rate Magnitude (displayed in Telemetry):</strong></p>
        <p>$$\\|\\boldsymbol{\\omega}_{los}\\| = \\frac{\\|\\mathbf{r} \\times \\mathbf{v}_r\\|}{R^2} = \\sqrt{\\omega_x^2 + \\omega_y^2 + \\omega_z^2} = \\sqrt{\\dot{\\theta}_{los}^2 + (\\dot{\\psi}_{los} \\cos\\theta_{los})^2}$$</p>

        <h3>3. PN Algorithm: Inputs, Outputs & Autopilot Control Flow</h3>
        <p>How does the guidance computer interact with onboard sensors and control actuators?</p>

        <p><strong>1. System Inputs (Sensor Measurements):</strong></p>
        <ul>
          <li><b>LOS Angular Rate ($\boldsymbol{\omega}_{los}$ or $\dot{\psi}, \dot{\theta}$, in $\text{rad/s}$):</b> Measured by seeker rate gyroscopes tracking target angular velocity.</li>
          <li><b>Closing Velocity ($V_c$, in $\text{m/s}$):</b> Measured by Doppler radar frequency shift.</li>
          <li><b>Missile Velocity Heading ($\mathbf{u}_m = \mathbf{v}_m / \|\mathbf{v}_m\|$):</b> Provided by onboard Inertial Measurement Unit (IMU).</li>
          <li><b>Navigation Constant ($N$):</b> Dimensionless gain (typically $3.0 \sim 5.0$).</li>
        </ul>

        <p><strong>2. System Output (Guidance Command):</strong></p>
        <p>$$\mathbf{a}_c = N \\cdot V_c \\cdot (\\boldsymbol{\\omega}_{los} \\times \\mathbf{u}_m)$$</p>
        <ul>
          <li><b>Core Output:</b> The only output of the PN algorithm is the <b>Transverse Acceleration Command Vector $\mathbf{a}_c$ (in $\text{m/s}^2$ or $\text{G}$)</b>, strictly normal to the velocity vector.</li>
          <li><b>Why acceleration, not angular velocity ($\text{rad/s}$)?</b> Missiles cannot magically pivot in mid-air. Aerodynamic control fins must generate physical centripetal lift force ($\mathbf{F} = m \cdot \mathbf{a}_c$) to bend the flight trajectory.</li>
          <li><b>3D Decomposition:</b>
            <ul>
              <li>$a_{c,\\text{yaw}}$ (Horizontal Acceleration) $\to$ commands vertical rudder fins for left/right turns.</li>
              <li>$a_{c,\\text{pitch}}$ (Vertical Acceleration) $\to$ commands horizontal elevator fins for pull-up/push-down maneuvers.</li>
            </ul>
          </li>
        </ul>

        <p><strong>Body-frame basis for that decomposition:</strong> for a zero-bank (skid-to-turn) missile the plane normal to the velocity is spanned by</p>
        <p>$$\\hat{e}_{right} = \\frac{\\mathbf{u}_m \\times \\hat{y}}{\\|\\mathbf{u}_m \\times \\hat{y}\\|}, \\qquad \\hat{e}_{up} = \\hat{e}_{right} \\times \\mathbf{u}_m$$</p>
        <p>giving the two fin channels $a_{c,yaw} = \\mathbf{a}_c \\cdot \\hat{e}_{right}$ (positive $=$ turn right) and $a_{c,pitch} = \\mathbf{a}_c \\cdot \\hat{e}_{up}$ (positive $=$ pull up). Because $\\mathbf{a}_c \\perp \\mathbf{u}_m$ by construction the split is lossless:</p>
        <p>$$\\|\\mathbf{a}_c\\|^2 = a_{c,yaw}^2 + a_{c,pitch}^2$$</p>
        <p>Both channels are shown live on the <b>Cmd Yaw / Pitch</b> telemetry row, signed as R/L and U/D, and drawn as a 2D arrow on the <b>$\\mathbf{a}_c$ Direction</b> gauge beneath it — horizontal deflection is rudder, vertical is elevator. The arrow is scaled by $\\|\\mathbf{a}_c\\| / a_{max}$, so the dashed circle marks the current G-limit and an arrow touching it means the command is saturated.</p>

        <p><strong>3. Closed-Loop Autopilot Control Diagram:</strong></p>
        <p>$$\\text{Seeker } (V_c, \\boldsymbol{\\omega}_{los}) \\xrightarrow{\\text{PN Guidance Law}} \\mathbf{a}_c \\text{ (Acceleration Cmd)} \\xrightarrow{\\text{Autopilot}} \\boldsymbol{\\delta} \\text{ (Fin Deflection)} \\xrightarrow{\\text{Aerodynamic Lift}} \\mathbf{a}_m \\text{ (Flight Turn)}$$</p>

        <h3>4. Acceleration Limit & Saturation ($a_{max}$)</h3>
        <p>The command $\\mathbf{a}_c$ is what the guidance law <i>wants</i>. What the missile actually <i>gets</i> is decided by the airframe, and four independent mechanisms bound it:</p>
        <ul>
          <li><b>Aerodynamic:</b> lateral acceleration is lift over mass, and lift saturates at maximum angle of attack: $$a_{max} = \\frac{\\frac{1}{2}\\rho V^2 S\\, C_{L,max}}{m}$$ Note the $\\rho$ and $V^2$ dependence — the same airframe is far less agile when slow or high.</li>
          <li><b>Structural:</b> a design load factor beyond which the airframe breaks up.</li>
          <li><b>Actuator:</b> fin deflection angle and slew rate saturate.</li>
          <li><b>Autopilot lag:</b> the response has a time constant $\\tau$ and is never instantaneous (not modelled in this simulation).</li>
        </ul>

        <p><strong>Why G is the natural unit:</strong> the load factor $n = a / g_0$ (with $g_0 = 9.80665\\text{ m/s}^2$) is dimensionless, and structural limits are specified that way, so G compares directly across airframes. Typical surface-to-air missiles sustain $30 \\sim 50\\text{ G}$, short-range air-to-air missiles up to $60\\text{ G}$. The engineering rule of thumb is that an interceptor needs roughly $3\\times$ the target's manoeuvre capability — a Shahed-136 delta-wing drone pulls only $2 \\sim 3\\text{ G}$, which is why $30\\text{ G}$ is ample here.</p>

        <p><strong>Saturation applied in this simulation:</strong></p>
        <p>$$\\mathbf{a}_m = \\begin{cases} \\mathbf{a}_c & \\text{if } \\|\\mathbf{a}_c\\| \\le a_{max} \\\\[4pt] a_{max} \\dfrac{\\mathbf{a}_c}{\\|\\mathbf{a}_c\\|} & \\text{otherwise} \\end{cases}$$</p>
        <p>The telemetry panel shows $\\mathbf{a}_c$ and $\\mathbf{a}_m$ side by side precisely so you can see the moment the command gets clipped.</p>

        <p><strong>Optional aerodynamic limit:</strong> enabling <b>Aero G-Limit</b> in the settings makes $a_{max}$ track dynamic pressure $q = \\frac{1}{2}\\rho V^2$ instead of staying constant. Referencing the sea-level design point at $V_{ref} = 400\\text{ m/s}$ collapses $S$, $C_{L,max}$ and $m$ into a single ratio, capped from above by the structural ceiling:</p>
        <p>$$n_{eff} = n_{struct} \\cdot \\min\\left(1, \\frac{q}{q_{ref}}\\right), \\qquad \\frac{q}{q_{ref}} = \\frac{\\rho(h)}{\\rho_0}\\left(\\frac{V}{V_{ref}}\\right)^2$$</p>
        <p>using the ISA troposphere density model $\\rho(h) = \\rho_0 \\left(1 - 2.25577 \\times 10^{-5} h\\right)^{4.25588}$ with $\\rho_0 = 1.225\\text{ kg/m}^3$. Drag the missile speed slider down and watch the available G collapse quadratically: a slow interceptor simply cannot pull the lead angle it needs.</p>

        <p><strong>How this couples back to $N$:</strong> against a target executing a step manoeuvre $a_t$, the terminal acceleration demand converges to</p>
        <p>$$\\frac{a_m}{a_t} = \\frac{N}{N - 2}$$</p>
        <p>so $N = 3$ demands $3\\times$ the target's G while $N = 5$ demands only $1.67\\times$. Raising $N$ eases saturation but amplifies seeker noise — hence the classical compromise $N \\in [3, 5]$.</p>

        <h3>5. Interception Geometry: Lateral Crossing, Head-on & Beam</h3>
        <p>The simulation offers three distinct operational flight corridors:</p>

        <ul>
          <li>
            <strong>1. Coastline Crossing (Lateral / Flank Interception):</strong>
            <p>The target cruises straight along the coastline ($+Z \\to -Z$), presenting a high initial Line-of-Sight rotation rate $\\dot{\\lambda}$. Proportional Navigation generates a lateral lead acceleration to establish a collision course, creating a classical curved pursuit trajectory that intercepts the target from the flank.</p>
          </li>
          <li>
            <strong>2. Direct Inbound (Head-on / Frontal Interception):</strong>
            <p>The target approaches head-on across the strait toward the base. High closing velocity $V_c = \\|\\mathbf{v}_m\\| + \\|\\mathbf{v}_t\\| \\approx 580\\text{ m/s}$ requires minimal lateral correction and results in a rapid frontal engagement.</p>
          </li>
          <li>
            <strong>3. Beam Crossing (Pure 90° Flank):</strong>
            <p>The <em>beam point</em> — where the track passes closest to the battery — is placed <em>on the launch bearing</em>, so the heading there is perpendicular to the fixed rail as well as to the line of sight. Seen from above the crossing is a clean right angle, and because the track is horizontal while sharing the rail's azimuth $\\psi_{rail}$, the 3D angle to the missile nose is exactly $90^\\circ$ too — independent of the rail's $45^\\circ$ elevation:</p>
            <p>$$\\mathbf{d} = (\\cos\\psi_{rail},\\ 0,\\ \\sin\\psi_{rail}), \\qquad \\mathbf{d} \\cdot \\mathbf{u}_{nose} = \\mathbf{d} \\cdot \\hat{u}_{los,b} = 0$$</p>
            <p>The drone spawns on that point at $d = 1575\\text{ m}$, so the launch heading error is <em>pure elevation</em> — the rail's $45^\\circ$ against the threat's $18.5^\\circ$, giving $26.5^\\circ$ with no azimuth error at all. Spawning it upstream instead is a single parameter: along a straight track $\\sin(\\text{aspect}) = d / R$, so an aspect $\\theta$ backs the spawn up by $d / \\tan\\theta$ and opens the engagement while the target is still closing.</p>
            <p>From the beam point the target contributes nothing whatsoever to $V_c$ — the closing rate is entirely the missile's own. This is also the most marginal corridor at the fuze: proportional navigation cannot fully null a $90^\\circ$ crossing before impact, so the miss distance settles around $11\\text{ m}$ against the $12\\text{ m}$ lethal radius, where the other two corridors land inside $10\\text{ m}$.</p>
          </li>
        </ul>
        <p>Watching the <b>Cmd Yaw / Pitch</b> row across all three is instructive, and the <em>fixed rail</em> is what shapes it. The battery does not slew: every round leaves at $58^\\circ$ azimuth and $+45^\\circ$ elevation no matter where the threat is, so each corridor opens with a built-in heading error — $26.5^\\circ$ for <em>Beam Crossing</em> and $32.5^\\circ$ for <em>Direct Inbound</em>, both almost entirely in elevation, but $74^\\circ$ for <em>Coastline Crossing</em>, whose bearing sits most of a quadrant off the rail. Direct Inbound stays confined to the vertical plane and runs nearly pure pitch ($13.5\\text{ G}$ against $1.3\\text{ G}$ of yaw). Beam Crossing opens with <em>zero</em> azimuth error but builds yaw steadily as the threat crosses the boresight, ending up balanced ($14.2\\text{ G}$ yaw, $15.7\\text{ G}$ pitch). Coastline Crossing has to swing the nose across in azimuth from the outset, demanding $27.3\\text{ G}$ of yaw — enough to saturate the $30\\text{ G}$ limit for $46$ of its $201$ frames. That is the corridor to pick if you want to watch the $\\mathbf{a}_c$ Direction arrow pin itself against the dashed circle and turn orange.</p>

        <h3>6. Terminal Interception Mechanics: Proximity Fuze vs. Hit-to-Kill</h3>
        <p>In real-world air defense engineering, missiles rarely require a physical direct collision to eliminate threats:</p>
        
        <ul>
          <li>
            <strong>1. Proximity Fuze & Blast-Fragmentation Warheads (近炸引信破片殺傷):</strong>
            <p>Air defense missiles (e.g., AIM-9X, AIM-120, Patriot PAC-2, Iron Dome Tamir) employ active optical laser or RF radar proximity fuzes. When the missile reaches the optimal kill sphere ($5 \\sim 15\\text{ m}$ from the target), the fuze detonates the warhead, releasing thousands of high-velocity tungsten fragments ($2,000 \\sim 3,000\\text{ m/s}$) and intense shockwaves to shred the airframe, fuel tanks, and propulsion.</p>
            <p>The kill probability is governed by fragment spatial density:</p>
            <p>$$P_k = 1 - \\exp\\left(-\\frac{N_f \\cdot A_t}{4\\pi R^2}\\right)$$</p>
            <p>where $N_f$ is fragment count, $A_t$ is target vulnerable area, and $R$ is detonation miss distance.</p>
          </li>
          <li>
            <strong>2. Hit-to-Kill (HTK / 直接動能撞擊):</strong>
            <p>Dedicated anti-ballistic missile systems (e.g., PAC-3 MSE, THAAD, SM-3) employ Kinetic Kill Vehicles (KKV) with divert attitude thrusters (DACS) to achieve physical direct impact ($R = 0\\text{ m}$), relying on extreme kinetic energy ($E_k = \\frac{1}{2}mv^2$) to pulverize hardened reentry vehicles.</p>
          </li>
        </ul>

        <h3>7. Implementation Algorithm (JavaScript)</h3>
        <pre><code class="language-js">function calculatePN(r_m, v_m, r_t, v_t, N, maxAccelG) {
  const los = new THREE.Vector3().subVectors(r_t, r_m);
  const R = los.length();
  const v_r = new THREE.Vector3().subVectors(v_t, v_m);
  
  // 1. LOS Spherical Angles (Azimuth & Elevation)
  const losAzimuth = (Math.atan2(los.x, -los.z) * 180 / Math.PI + 360) % 360;
  const losElevation = Math.asin(Math.max(-1, Math.min(1, los.y / R))) * 180 / Math.PI;

  // 2. Closing velocity Vc
  const Vc = -los.dot(v_r) / R;
  
  // 3. 3D LOS Rate vector (combined horizontal & vertical rotation)
  const omega_los = new THREE.Vector3().crossVectors(los, v_r).divideScalar(R * R);
  const losRateMagnitude = omega_los.length();
  
  // 4. Guidance acceleration command perpendicular to missile heading
  const u_m = v_m.clone().normalize();
  const a_c = new THREE.Vector3().crossVectors(omega_los, u_m).multiplyScalar(N * Vc);

  // 5. Airframe saturation: clip to what the fins can actually lift
  const a_max = maxAccelG * 9.80665;
  const a_m = a_c.clone().clampLength(0, a_max);
  const isSaturated = a_c.length() > a_max;

  return { Vc, omega_los, losRateMagnitude, a_c, a_m, isSaturated, losAzimuth, losElevation };
}</code></pre>
      `,
      zhTW: `
        <h3>1. 比例導引律 (Proportional Navigation, PN) 原理</h3>
        <p>比例導引律（PN）為防空飛彈與防衛系統廣泛採用的精確攔截導引演算法。其核心思想為：<b>飛彈的橫向導引加速度指令方向垂直於速度向量，且其大小與視線旋轉角速率（LOS Rate, $\\dot{\\lambda}$）及趨近速度（Closing Velocity, $V_c$）成正比。</b></p>
        
        <h3>2. 幾何向量與視線球座標定義 (LOS Geometry)</h3>
        <p>設飛彈位置與速度分別為 $\\mathbf{r}_m = (x_m, y_m, z_m), \\mathbf{v}_m$，無人機目標位置與速度為 $\\mathbf{r}_t = (x_t, y_t, z_t), \\mathbf{v}_t$。</p>
        
        <p><strong>視線向量 (Line-of-Sight, LOS)：</strong></p>
        <p>$$\\mathbf{r} = \\mathbf{r}_t - \\mathbf{r}_m = (r_x, r_y, r_z), \\quad R = \\|\\mathbf{r}\\|, \\quad \\mathbf{u}_{los} = \\frac{\\mathbf{r}}{R}$$</p>

        <p><strong>視線方位角與俯仰角（LOS Azimuth & Elevation）：</strong></p>
        <p>在三維大地慣性座標系中，視線向量在空間中的指向可由兩個球座標角度唯一確定：</p>
        <ul>
          <li>
            <strong>方位角（Azimuth / 水平偏航角 Yaw $\\psi_{los}$）：</strong>
            $$\\psi_{los} = \\text{atan2}(r_x, -r_z) \\in [0^\\circ, 360^\\circ)$$
            表示目標在水平地面（$X$-$Z$ 平面）上的羅盤方位指向（例如 $0^\\circ$ 正北、$90^\\circ$ 正東）。
          </li>
          <li>
            <strong>俯仰角（Elevation / 垂直仰角 Pitch $\\theta_{los}$）：</strong>
            $$\\theta_{los} = \\arcsin\\left(\\frac{r_y}{R}\\right) \\in [-90^\\circ, +90^\\circ]$$
            表示目標高出海平面（水平面）的垂直向上仰角（正值為抬頭仰角，負值為俯角）。
          </li>
        </ul>
        <p><em>*概念辨析：</em> 機體姿態角（$\\text{Yaw}, \\text{Pitch}, \\text{Roll}$）描述的是飛彈「自身機頭」朝向哪裡；而視線方位角與俯仰角（$\\text{Azimuth}, \\text{Elevation}$）描述的是「尋標頭視線」指向空間中目標的幾何角度。</p>
        
        <p><strong>相對速度與趨近速度 ($V_c$)：</strong></p>
        <p>$$\\mathbf{v}_r = \\mathbf{v}_t - \\mathbf{v}_m, \\quad V_c = -\\dot{R} = -\\frac{\\mathbf{r} \\cdot \\mathbf{v}_r}{R}$$</p>
        
        <p><strong>3D 視線角速度向量計算（LOS Rate Vector $\\boldsymbol{\\omega}_{los}$）：</strong></p>
        <p>三維空間中的視線旋轉角速度 $\\boldsymbol{\\omega}_{los}$ 是<b>同時涵蓋水平轉向與垂直升降的三維向量外積合成</b>：</p>
        <p>$$\\boldsymbol{\\omega}_{los} = \\frac{\\mathbf{r} \\times \\mathbf{v}_r}{R^2} = \\begin{bmatrix} \\omega_x \\\\ \\omega_y \\\\ \\omega_z \\end{bmatrix}$$</p>
        <p><strong>視線旋轉總角速率純量大小（即 Telemetry 面板顯示的 $\\|\\boldsymbol{\\omega}_{los}\\|$）：</strong></p>
        <p>$$\\|\\boldsymbol{\\omega}_{los}\\| = \\frac{\\|\\mathbf{r} \\times \\mathbf{v}_r\\|}{R^2} = \\sqrt{\\omega_x^2 + \\omega_y^2 + \\omega_z^2} = \\sqrt{\\dot{\\theta}_{los}^2 + (\\dot{\\psi}_{los} \\cos\\theta_{los})^2}$$</p>

        <h3>3. 比例導引算法：輸入端、輸出端與飛控控制流程</h3>
        <p>導引電腦（Guidance Computer）如何從感測器讀取訊號並控制飛彈？</p>

        <p><strong>1. 演算法輸入端 (Input)：</strong></p>
        <ul>
          <li><b>視線旋轉角速度（$\\boldsymbol{\\omega}_{los}$ 或 水平 $\\dot{\\psi}$ / 垂直 $\\dot{\\theta}$，單位 $\\text{rad/s}$）：</b>由尋標頭內部安裝的速率陀螺儀（Rate Gyro）即時測量。</li>
          <li><b>趨近速度（$V_c$，單位 $\\text{m/s}$）：</b>由都卜勒雷達回波頻移（Doppler Shift）即時測量。</li>
          <li><b>飛彈當前航向單位向量（$\\mathbf{u}_m = \\mathbf{v}_m / \\|\\mathbf{v}_m\\|$）：</b>由機載慣性導航系統（IMU）提供。</li>
          <li><b>導引增益常數（$N$）：</b>系統預設常數（典型值 $3.0 \\sim 5.0$）。</li>
        </ul>

        <p><strong>2. 演算法輸出端 (Output)：</strong></p>
        <p>$$\\mathbf{a}_c = N \\cdot V_c \\cdot (\\boldsymbol{\\omega}_{los} \\times \\mathbf{u}_m)$$</p>
        <ul>
          <li><b>核心唯一輸出：</b>PN 導引律的輸出為<b>「垂直於飛彈速度的橫向加速度指令向量 $\\mathbf{a}_c$」（單位為 $\\text{m/s}^2$ 或 $\\text{G}$）</b>。</li>
          <li><b>為什麼輸出不是 $\\text{rad/s}$？</b> 因為 $\\text{rad/s}$ 是尋標頭感測到的<b>輸入量</b>。飛彈在高速飛行中無法在空中「憑空自轉」，物理上必須依賴氣動舵面產生實體向心升力（$\\mathbf{F} = m \\cdot \\mathbf{a}_c$）來彎曲飛行軌跡。</li>
          <li><b>三維空間分解：</b>
            <ul>
              <li>$a_{c,\\text{yaw}}$（水平加速度分量）$\\to$ 命令垂直方位的舵面偏轉，使飛彈向左或向右轉彎。</li>
              <li>$a_{c,\\text{pitch}}$（垂直加速度分量）$\\to$ 命令水平方位的舵面偏轉，使飛彈抬頭爬升或低頭俯衝。</li>
            </ul>
          </li>
        </ul>

        <p><strong>上述分解所依據的彈體座標基底：</strong>對於零滾轉（skid-to-turn）飛彈，垂直於速度向量的橫向平面由下列兩軸張成：</p>
        <p>$$\\hat{e}_{right} = \\frac{\\mathbf{u}_m \\times \\hat{y}}{\\|\\mathbf{u}_m \\times \\hat{y}\\|}, \\qquad \\hat{e}_{up} = \\hat{e}_{right} \\times \\mathbf{u}_m$$</p>
        <p>兩個舵面通道即為 $a_{c,yaw} = \\mathbf{a}_c \\cdot \\hat{e}_{right}$（正值 $=$ 右轉）與 $a_{c,pitch} = \\mathbf{a}_c \\cdot \\hat{e}_{up}$（正值 $=$ 拉起）。由於 $\\mathbf{a}_c$ 在建構上就垂直於 $\\mathbf{u}_m$，這個分解是無損的：</p>
        <p>$$\\|\\mathbf{a}_c\\|^2 = a_{c,yaw}^2 + a_{c,pitch}^2$$</p>
        <p>兩個分量即時顯示於遙測面板的 <b>Cmd Yaw / Pitch</b> 欄位（以 R/L 與 U/D 表示正負向），並於其下方的 <b>$\\mathbf{a}_c$ Direction</b> 儀表以 2D 箭頭繪出 —— 水平偏轉對應方向舵、垂直偏轉對應升降舵。箭頭長度依 $\\|\\mathbf{a}_c\\| / a_{max}$ 正規化，因此虛線圓即為當前 G 上限，箭頭觸及圓周就代表指令已飽和。</p>

        <p><strong>3. 飛控閉迴路（Autopilot Control Loop）架構：</strong></p>
        <p>$$\\text{尋標頭/都卜勒測量 } (V_c, \\boldsymbol{\\omega}_{los}) \\xrightarrow{\\text{PN 導引律}} \\mathbf{a}_c \\text{ (加速度指令)} \\xrightarrow{\\text{飛控電腦 (Autopilot)}} \\boldsymbol{\\delta} \\text{ (舵機偏角)} \\xrightarrow{\\text{舵面氣動力}} \\mathbf{a}_m \\text{ (實際轉向過載)}$$</p>

        <h3>4. 加速度上限與飽和（Acceleration Limit & Saturation, $a_{max}$）</h3>
        <p>導引律算出的 $\\mathbf{a}_c$ 只是「想要」的指令；飛彈實際「拿得到」多少，由彈體本身決定。四個獨立機制構成上限：</p>
        <ul>
          <li><b>氣動極限（Aerodynamic）：</b>橫向加速度來自升力除以質量，而升力在最大攻角（AoA）處飽和：$$a_{max} = \\frac{\\frac{1}{2}\\rho V^2 S\\, C_{L,max}}{m}$$ 注意 $\\rho$ 與 $V^2$ 的依賴性——同一枚飛彈在低速或高空下，機動能力會大幅衰退。</li>
          <li><b>結構極限（Structural）：</b>彈體設計過載上限，超過即解體。</li>
          <li><b>作動器極限（Actuator）：</b>舵面偏轉角度與偏轉速率（slew rate）飽和。</li>
          <li><b>飛控延遲（Autopilot lag）：</b>指令響應有時間常數 $\\tau$，不可能瞬間達成（本模擬未建模此項）。</li>
        </ul>

        <p><strong>為什麼用 G 當單位：</strong>過載係數 $n = a / g_0$（$g_0 = 9.80665\\text{ m/s}^2$）為無因次量，而結構極限本來就是以過載係數規範，因此 G 可以跨彈種直接比較。典型防空飛彈可承受 $30 \\sim 50\\text{ G}$，短程空對空飛彈可達 $60\\text{ G}$。工程上的經驗法則是：攔截彈需具備目標約 <b>3 倍</b>的機動能力——Shahed-136 三角翼無人機大約只有 $2 \\sim 3\\text{ G}$，所以本模擬的 $30\\text{ G}$ 相當充裕。</p>

        <p><strong>本模擬採用的飽和處理：</strong></p>
        <p>$$\\mathbf{a}_m = \\begin{cases} \\mathbf{a}_c & \\text{若 } \\|\\mathbf{a}_c\\| \\le a_{max} \\\\[4pt] a_{max} \\dfrac{\\mathbf{a}_c}{\\|\\mathbf{a}_c\\|} & \\text{否則} \\end{cases}$$</p>
        <p>遙測面板將 $\\mathbf{a}_c$（指令）與 $\\mathbf{a}_m$（實際施加）並列顯示，就是為了讓你看見指令「被削掉」的那一刻。</p>

        <p><strong>選用：氣動 G 上限模型：</strong>在設定面板勾選 <b>Aero G-Limit</b> 後，$a_{max}$ 不再是常數，而會隨動壓 $q = \\frac{1}{2}\\rho V^2$ 變化。以海平面、$V_{ref} = 400\\text{ m/s}$ 的設計點作為參考，可將 $S$、$C_{L,max}$、$m$ 收斂成單一比值，並由結構極限封頂：</p>
        <p>$$n_{eff} = n_{struct} \\cdot \\min\\left(1, \\frac{q}{q_{ref}}\\right), \\qquad \\frac{q}{q_{ref}} = \\frac{\\rho(h)}{\\rho_0}\\left(\\frac{V}{V_{ref}}\\right)^2$$</p>
        <p>其中空氣密度採用 ISA 對流層模型 $\\rho(h) = \\rho_0 \\left(1 - 2.25577 \\times 10^{-5} h\\right)^{4.25588}$，$\\rho_0 = 1.225\\text{ kg/m}^3$。試著把飛彈速度滑桿往下拉，可用 G 值會以平方關係崩塌——低速攔截彈根本拉不出所需的前置角。</p>

        <p><strong>與導引增益 $N$ 的耦合：</strong>面對執行階躍機動 $a_t$ 的目標，終端所需的飛彈過載會收斂至</p>
        <p>$$\\frac{a_m}{a_t} = \\frac{N}{N - 2}$$</p>
        <p>因此 $N = 3$ 需要目標 $3$ 倍的過載，而 $N = 5$ 只需 $1.67$ 倍。提高 $N$ 可緩解飽和問題，但同時會放大尋標頭雜訊——這正是業界慣用 $N \\in [3, 5]$ 折衷的原因。</p>

        <h3>5. 攔截幾何分析：側向攔截 vs. 迎頭攔截 vs. 正橫穿越</h3>
        <p>系統提供三條經典戰術航線供對比比例導引特性：</p>

        <ul>
          <li>
            <strong>1. 沿海岸線飛行（Coastline Crossing - 側向攔截）：</strong>
            <p>目標沿著海岸線南北向筆直巡航（$+Z \\to -Z$），與陣地形成大角度側向橫越。此時視線角速率（$\\dot{\\lambda}$）極大，比例導引將產生大幅度側向過載指令以建立前置攔截角（Lead Angle），呈現壯觀的側向弧形截擊軌跡。</p>
          </li>
          <li>
            <strong>2. 海峽正面進襲（Direct Inbound - 迎頭正面攔截）：</strong>
            <p>目標從外海朝向海岸基地直飛進襲。此時相對閉合速度高達 $V_c \\approx 580\\text{ m/s}$，視線旋轉率低，飛彈以高迎頭速度迅速完成中段與終端攔截。</p>
          </li>
          <li>
            <strong>3. 正橫穿越（Beam Crossing － 純 90° 側掠）：</strong>
            <p><em>正橫點</em>（beam point，整條航跡最接近陣地之處）刻意設在<em>發射軌的射向線上</em>，因此該處航向不僅垂直於視線，也垂直於固定射軌。由上往下俯視即為一個標準的直角穿越；又因航跡是水平的、且與射軌共用方位角 $\\psi_{rail}$，它與彈頭朝向的 3D 夾角同樣恰為 $90^\\circ$ —— 與射軌 $45^\\circ$ 的仰角無關：</p>
            <p>$$\\mathbf{d} = (\\cos\\psi_{rail},\\ 0,\\ \\sin\\psi_{rail}), \\qquad \\mathbf{d} \\cdot \\mathbf{u}_{nose} = \\mathbf{d} \\cdot \\hat{u}_{los,b} = 0$$</p>
            <p>無人機直接生成在該點（$d = 1575\\text{ m}$），因此發射時的航向誤差<em>純粹來自仰角</em> —— 射軌 $45^\\circ$ 對威脅 $18.5^\\circ$，差 $26.5^\\circ$，方位誤差為零。若要改成上游重生也只是一個參數：直線航跡上恆有 $\\sin(\\text{aspect}) = d / R$，故 aspect 取 $\\theta$ 即可把重生點往回推 $d / \\tan\\theta$，讓交戰在目標仍持續接近時展開。</p>
            <p>自正橫點起，目標對 $V_c$ 完全沒有貢獻 —— 趨近速率全部來自飛彈本身。這也是三條航線中在引信裕度上最吃緊的一條：比例導引無法在撞擊前完全消除 $90^\\circ$ 穿越的視線角速率，因此脫靶距離穩定落在 $11\\text{ m}$ 附近，而殺傷半徑為 $12\\text{ m}$（另外兩條航線都在 $10\\text{ m}$ 以內）。</p>
          </li>
        </ul>
        <p>對照三條航線的 <b>Cmd Yaw / Pitch</b> 欄位很有啟發性，而真正主導這個分配的是<em>固定發射軌</em>：砲塔不會迴旋追瞄，無論威脅在哪，每一發都以 $58^\\circ$ 方位、$+45^\\circ$ 仰角出膛，因此每條航線一開始就帶有內建的航向誤差 —— <em>Beam Crossing</em> 為 $26.5^\\circ$、<em>Direct Inbound</em> 為 $32.5^\\circ$，兩者幾乎全部來自仰角落差；而 <em>Coastline Crossing</em> 高達 $74^\\circ$（其方位與射軌差了將近一個象限）。Direct Inbound 全程被侷限在垂直平面內，接近純 pitch 通道（$13.5\\text{ G}$ 對 yaw 僅 $1.3\\text{ G}$）；Beam Crossing 起始方位誤差為<em>零</em>，但隨著威脅橫掠射向線，yaw 會穩定累積，最終呈現均衡分配（yaw $14.2\\text{ G}$、pitch $15.7\\text{ G}$）；Coastline Crossing 則從一開始就必須在方位上把彈頭大幅甩過去，需要 $27.3\\text{ G}$ 的 yaw —— 足以讓 $30\\text{ G}$ 上限在 $201$ 幀中飽和 $46$ 幀。想看 $\\mathbf{a}_c$ Direction 箭頭釘在虛線圓上並轉為橘色，就選這條航線。</p>

        <h3>6. 末端攔截引信機制：近炸引信 vs. 直接動能撞擊 (Hit-to-Kill)</h3>
        <p>在真實世界的防空作戰工程中，飛彈並非必須以「肉體物理相撞」才能摧毀目標：</p>

        <ul>
          <li>
            <strong>1. 近炸引信與高爆破片殺傷彈頭（Proximity Fuze & Blast-Fragmentation）：</strong>
            <p>防空與空對空飛彈（如 AIM-9X、AIM-120、愛國者 PAC-2、鐵穹 Tamir）配備主動雷射或雷達都卜勒近炸引信。當飛彈飛抵目標周圍殺傷半徑（$5 \\sim 15\\text{ m}$）內時，引信會以微秒級速度觸發彈頭引爆，向四周釋放數千顆高速鎢合金預製破片（初速達 $2,000 \\sim 3,000\\text{ m/s}$）與高壓衝擊波，直接撕裂機體與航電。</p>
            <p>殺傷機率與破片空間密度關係式：</p>
            <p>$$P_k = 1 - \\exp\\left(-\\frac{N_f \\cdot A_t}{4\\pi R^2}\\right)$$</p>
            <p>其中 $N_f$ 為預製破片總數，$A_t$ 為目標易損面積，$R$ 為引爆脫靶距離。只要 $R \\le 15\\text{ m}$，殺傷率即趨近 $100\\%$，大幅降低了超音速終端導引的過載負擔。</p>
          </li>
          <li>
            <strong>2. 直接動能撞擊（Hit-to-Kill, HTK）：</strong>
            <p>專門用於反彈道飛彈系統（如 PAC-3 MSE、THAAD、SM-3）採用動能攔截器（KKV），配備姿態控制微型火箭（DACS）進行毫米級精度微調，直接以數倍音速物理正面撞擊敵方堅硬彈頭，依靠巨大動能（$E_k = \\frac{1}{2}mv^2$）徹底粉碎彈頭。</p>
          </li>
        </ul>

        <h3>7. 核心演算法實現 (JavaScript)</h3>
        <pre><code class="language-js">function calculatePN(r_m, v_m, r_t, v_t, N, maxAccelG) {
  const los = new THREE.Vector3().subVectors(r_t, r_m);
  const R = los.length();
  const v_r = new THREE.Vector3().subVectors(v_t, v_m);
  
  // 1. 視線球座標空間角度 (Azimuth 方位角 & Elevation 俯仰角)
  const losAzimuth = (Math.atan2(los.x, -los.z) * 180 / Math.PI + 360) % 360;
  const losElevation = Math.asin(Math.max(-1, Math.min(1, los.y / R))) * 180 / Math.PI;

  // 2. 趨近速度 Vc
  const Vc = -los.dot(v_r) / R;
  
  // 3. 3D 視線角速度向量 (水平與垂直旋轉之空間向量合成)
  const omega_los = new THREE.Vector3().crossVectors(los, v_r).divideScalar(R * R);
  const losRateMagnitude = omega_los.length();
  
  // 4. 垂直於飛彈前進方向之導引加速度指令
  const u_m = v_m.clone().normalize();
  const a_c = new THREE.Vector3().crossVectors(omega_los, u_m).multiplyScalar(N * Vc);

  // 5. 彈體飽和限制：削減至舵面實際能產生的過載
  const a_max = maxAccelG * 9.80665;
  const a_m = a_c.clone().clampLength(0, a_max);
  const isSaturated = a_c.length() > a_max;

  return { Vc, omega_los, losRateMagnitude, a_c, a_m, isSaturated, losAzimuth, losElevation };
}</code></pre>
      `
    };

    this.bindEvents();
  }

  bindEvents() {
    this.openBtn.addEventListener('click', () => {
      this.render();
      this.modal.hidden = false;
    });

    this.closeBtn.addEventListener('click', () => {
      this.modal.hidden = true;
    });

    this.langBtn.addEventListener('click', () => {
      this.language = this.language === 'en' ? 'zhTW' : 'en';
      try {
        localStorage.setItem('missile_sim_lang', this.language);
      } catch (e) { /* ignore */ }
      this.render();
    });

    // Close on clicking backdrop
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.modal.hidden = true;
      }
    });
  }

  render() {
    this.content.innerHTML = this.modalCopy[this.language];
    renderMathInElement(this.content, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
    Prism.highlightAllUnder(this.content);
  }
}
