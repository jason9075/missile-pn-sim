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

    this.language = 'en'; // 'en' or 'zhTW'

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

        <h3>4. Implementation Algorithm (JavaScript)</h3>
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

        <h3>4. 核心演算法實現 (JavaScript)</h3>
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
