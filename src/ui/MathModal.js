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

    this.language = 'zhTW'; // Default to Traditional Chinese

    this.modalCopy = {
      en: `
        <h3>1. Proportional Navigation Guidance Law (PN)</h3>
        <p>Proportional Navigation (PN) is a proven homing guidance law used by modern air defense missiles. The fundamental principle is to command a lateral acceleration proportional to the Line-of-Sight (LOS) rotation rate $\\dot{\\lambda}$ and the closing velocity $V_c$.</p>
        
        <h3>2. Kinematics & Geometry Definitions</h3>
        <p>Let $\\mathbf{r}_m$ and $\\mathbf{v}_m$ be the position and velocity of the missile, and $\\mathbf{r}_t$ and $\\mathbf{v}_t$ be those of the target.</p>
        <p><strong>Line-of-Sight (LOS) Vector:</strong></p>
        <p>$$\\mathbf{r} = \\mathbf{r}_t - \\mathbf{r}_m, \\quad R = \\|\\mathbf{r}\\|, \\quad \\mathbf{u}_{los} = \\frac{\\mathbf{r}}{R}$$</p>
        
        <p><strong>Relative Velocity & Closing Velocity ($V_c$):</strong></p>
        <p>$$\\mathbf{v}_r = \\mathbf{v}_t - \\mathbf{v}_m, \\quad V_c = -\\dot{R} = -\\frac{\\mathbf{r} \\cdot \\mathbf{v}_r}{R}$$</p>
        
        <p><strong>LOS Angular Velocity Vector (LOS Rate $\\boldsymbol{\\omega}_{los}$):</strong></p>
        <p>$$\\boldsymbol{\\omega}_{los} = \\frac{\\mathbf{r} \\times \\mathbf{v}_r}{R^2}$$</p>

        <h3>3. 3D True Proportional Navigation (TPN) Acceleration Command</h3>
        <p>The guidance acceleration command $\\mathbf{a}_c$ is perpendicular to the missile velocity unit vector $\\mathbf{u}_m = \\mathbf{v}_m / \\|\\mathbf{v}_m\\|$:</p>
        <p>$$\\mathbf{a}_c = N \\cdot V_c \\cdot (\\boldsymbol{\\omega}_{los} \\times \\mathbf{u}_m)$$</p>
        <p>where $N$ is the Navigation Gain Constant (typically $3.0 \\sim 5.0$).</p>

        <h3>4. Interception Geometry: Lateral Crossing vs. Head-on</h3>
        <p>The simulation offers two distinct operational flight corridors:</p>

        <ul>
          <li>
            <strong>1. Coastline Crossing (Lateral / Flank Interception):</strong>
            <p>The target cruises straight along the coastline ($+Z \\to -Z$), presenting a high initial Line-of-Sight rotation rate $\\dot{\\lambda}$. Proportional Navigation generates a lateral lead acceleration to establish a collision course, creating a classical curved pursuit trajectory that intercepts the target from the flank.</p>
          </li>
          <li>
            <strong>2. Direct Inbound (Head-on / Frontal Interception):</strong>
            <p>The target approaches head-on across the strait toward the base. High closing velocity $V_c = \\|\\mathbf{v}_m\\| + \\|\\mathbf{v}_t\\| \\approx 580\\text{ m/s}$ requires minimal lateral correction and results in a rapid frontal engagement.</p>
          </li>
        </ul>

        <h3>5. Terminal Interception Mechanics: Proximity Fuze vs. Hit-to-Kill</h3>
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

        <h3>6. Implementation Algorithm (JavaScript)</h3>
        <pre><code class="language-js">function calculatePN(r_m, v_m, r_t, v_t, N) {
  const los = new THREE.Vector3().subVectors(r_t, r_m);
  const R = los.length();
  const v_r = new THREE.Vector3().subVectors(v_t, v_m);
  
  // Closing velocity Vc
  const Vc = -los.dot(v_r) / R;
  
  // LOS Rate vector
  const omega_los = new THREE.Vector3().crossVectors(los, v_r).divideScalar(R * R);
  
  // Acceleration command perpendicular to missile heading
  const u_m = v_m.clone().normalize();
  const a_c = new THREE.Vector3().crossVectors(omega_los, u_m).multiplyScalar(N * Vc);
  
  return { Vc, omega_los, a_c };
}</code></pre>
      `,
      zhTW: `
        <h3>1. 比例導引律 (Proportional Navigation, PN) 原理</h3>
        <p>比例導引律（PN）為防空飛彈與防衛系統廣泛採用的精確攔截導引演算法。其核心思想為：<b>飛彈的橫向導引加速度指令方向垂直於速度向量，且其大小與視線旋轉角速率（LOS Rate, $\\dot{\\lambda}$）及趨近速度（Closing Velocity, $V_c$）成正比。</b></p>
        
        <h3>2. 幾何向量與物理量定義</h3>
        <p>設飛彈位置與速度分別為 $\\mathbf{r}_m, \\mathbf{v}_m$，無人機目標位置與速度為 $\\mathbf{r}_t, \\mathbf{v}_t$。</p>
        <p><strong>視線向量 (Line-of-Sight, LOS)：</strong></p>
        <p>$$\\mathbf{r} = \\mathbf{r}_t - \\mathbf{r}_m, \\quad R = \\|\\mathbf{r}\\|, \\quad \\mathbf{u}_{los} = \\frac{\\mathbf{r}}{R}$$</p>
        
        <p><strong>相對速度與趨近速度 ($V_c$)：</strong></p>
        <p>$$\\mathbf{v}_r = \\mathbf{v}_t - \\mathbf{v}_m, \\quad V_c = -\\dot{R} = -\\frac{\\mathbf{r} \\cdot \\mathbf{v}_r}{R}$$</p>
        
        <p><strong>視線旋轉角速度向量 (LOS Rate Vector $\\boldsymbol{\\omega}_{los}$)：</strong></p>
        <p>$$\\boldsymbol{\\omega}_{los} = \\frac{\\mathbf{r} \\times \\mathbf{v}_r}{R^2}$$</p>

        <h3>3. 3D 真比例導引 (True Proportional Navigation, TPN) 加速度指令</h3>
        <p>在三維空間中，橫向加速度指令 $\\mathbf{a}_c$ 垂直於飛彈速度方向 $\\mathbf{u}_m = \\mathbf{v}_m / \\|\\mathbf{v}_m\\|$：</p>
        <p>$$\\mathbf{a}_c = N \\cdot V_c \\cdot (\\boldsymbol{\\omega}_{los} \\times \\mathbf{u}_m)$$</p>
        <p>其中 $N$ 為導引常數（Navigation Constant / Gain），典型值設定為 $3.0 \\sim 5.0$。物理上受最大 G 值飽和限制 $a_{\\max}$。</p>

        <h3>4. 攔截幾何分析：側向攔截 vs. 迎頭正面攔截</h3>
        <p>系統提供兩條經典戰術航線供對比比例導引特性：</p>

        <ul>
          <li>
            <strong>1. 沿海岸線飛行（Coastline Crossing - 側向攔截）：</strong>
            <p>目標沿著海岸線南北向筆直巡航（$+Z \\to -Z$），與陣地形成大角度側向橫越。此時視線角速率（$\\dot{\\lambda}$）極大，比例導引將產生大幅度側向過載指令以建立前置攔截角（Lead Angle），呈現壯觀的側向弧形截擊軌跡。</p>
          </li>
          <li>
            <strong>2. 海峽正面進襲（Direct Inbound - 迎頭正面攔截）：</strong>
            <p>目標從外海朝向海岸基地直飛進襲。此時相對閉合速度高達 $V_c \\approx 580\\text{ m/s}$，視線旋轉率低，飛彈以高迎頭速度迅速完成中段與終端攔截。</p>
          </li>
        </ul>

        <h3>5. 末端攔截引信機制：近炸引信 vs. 直接動能撞擊 (Hit-to-Kill)</h3>
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

        <h3>6. 核心演算法實現 (JavaScript)</h3>
        <pre><code class="language-js">function calculatePN(r_m, v_m, r_t, v_t, N) {
  const los = new THREE.Vector3().subVectors(r_t, r_m);
  const R = los.length();
  const v_r = new THREE.Vector3().subVectors(v_t, v_m);
  
  // 趨近速度 Vc
  const Vc = -los.dot(v_r) / R;
  
  // 視線角速度向量 omega_los
  const omega_los = new THREE.Vector3().crossVectors(los, v_r).divideScalar(R * R);
  
  // 垂直於飛彈前進方向之導引加速度指令
  const u_m = v_m.clone().normalize();
  const a_c = new THREE.Vector3().crossVectors(omega_los, u_m).multiplyScalar(N * Vc);
  
  return { Vc, omega_los, a_c };
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
