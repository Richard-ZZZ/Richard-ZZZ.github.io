---
layout: default
title: "Ruijia Zhang"
---

<div style="display:flex; align-items:center; gap:30px;">

  <!-- 左边头像 -->
  <img src="/assets/img/IMG_7756.JPG" alt="Ruijia Zhang" width="180" style="border-radius:8px;">

  <!-- 右边文字 -->
  <div>
    <h1>Ruijia Zhang</h1>
    <p>PhD Candidate, Applied Mathematics & Statistics<br>
    Johns Hopkins University, Baltimore, MD, USA</p>
    <p>📧 rzhan127@jh.edu   🌐 <a href="https://scholar.google.com/citations?hl=en&view_op=list_works&gmla=AH8HC4xKcj1WPYEBl4BOKBJSNUDnuIYeSvYlkX7-dQ4kBPxmvPHlivRQCNgLqubQLr0uDDR6fpXjlDxT8F1wyw&user=gBhh93cAAAAJ">Google Scholar</a></p>
  </div>

</div>

<!-- Nav -->
<style>
  .navbar{
    display:grid;
    grid-template-columns: repeat(4, minmax(0,1fr)); /* 四个按钮均分整行 */
    gap:16px;
    margin:20px 0 28px;
  }
  .navbar a{
    display:block;
    text-align:center;
    padding:14px 0;
    border:2px solid #fcd34d;       /* 金黄描边 */
    border-radius:12px;
    background:#fef3c7;              /* 浅黄底 */
    color:#b45309 !important;        /* 深琥珀字色 */
    text-decoration:none !important; /* 去掉下划线 */
    font-weight:700;
    font-size:1.05rem;
    line-height:1;
    transition:all .2s ease;
  }
  .navbar a:hover{
    background:#fde68a;
    transform:translateY(-2px);
    box-shadow:0 4px 12px rgba(249,115,22,.15);
  }
  /* 小屏自适应：手机上两列 */
  @media (max-width: 640px){
    .navbar{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  }
</style>

<div class="navbar">
  <a href="#research">Research</a>
  <a href="#teaching">Teaching</a>
  <a href="#awards">Awards</a>
  <a href="#education">Education</a>
</div>

# About me
I am a PhD candidate in the **Department of Applied Mathematics and Statistics** at **Johns Hopkins University**, starting in August 2024.  
My research is broadly motivated by the question of how to make reliable and robust decisions under uncertainty. I work on problems at the intersection of applied probability, optimization, and reinforcement learning. My recent interests focus on **LLM Alignment** and **Diffusion Models**.

# Research

### Publications

<style>
  /* 只作用于 Publications */
  main .pubs a.pub-link,
  main .pubs a.pub-link:visited{
    color:#3399ff !important;        /* 浅蓝 */
    text-decoration:none !important;
    font-weight:700;
  }
  main .pubs a.pub-link:hover{
    color:#0066cc !important;        /* 悬停稍深 */
    text-decoration:underline !important;
  }
  main .pubs{ margin: 8px 0 0; padding-left: 1.2rem; }
  main .pubs li{ margin: 0 0 16px 0; }
  main .pubs .venue{ font-style: italic; }
  main .pubs .authors{ display:block; margin-top:2px; }
</style>

<ul class="pubs">
  <li>
    <a class="pub-link" href="https://arxiv.org/abs/2506.20406">
      POLAR: A Pessimistic Model-based Policy Learning Algorithm for Dynamic Treatment Regimes
    </a><br>
    <span class="venue">Major Revision at Journal of the American Statistical Association (JASA)</span><br>
    <span class="authors"><strong>Ruijia Zhang</strong>, Zhenglin Qi, Yue Wu, Xiangyu Zhang, Yanxun Xu.</span>
  </li>

  <li>
    <a class="pub-link" href="https://arxiv.org/abs/2503.17865">
      Understanding Inverse Reinforcement Learning under Overparameterization: Non-Asymptotic Analysis and Global Optimality
    </a><br>
    <span class="venue">AISTATS 2025</span><br>
    <span class="authors"><strong>Ruijia Zhang</strong>, Siliang Zeng, Chenliang Li, Alfredo Garcia, Mingyi Hong.</span>
  </li>

  <li>
    <a class="pub-link" href="https://arxiv.org/abs/2503.18317">
      Improved Rates of Differential Private Nonconvex Strongly Concave Minimax Optimization via Gradient Differences
    </a><br>
    <span class="venue">AAAI 2025</span><br>
    <span class="authors"><strong>Ruijia Zhang</strong>, Mingxi Lei, Meng Ding, Zihang Xiang, Jinhui Xu, Di Wang.</span>
  </li>
</ul>

### Ongoing Works
- **Random Matrix Makes LoRA More Efficient**.   
  **Ruijia Zhang**, Jiacheng Zhu, Laixi Shi.
  
- **Learning Optimal Robust Policies under Observational Data with Causal Transport**. *To be submitted to Operations Research*.  
  **Ruijia Zhang**, Luhao Zhang, Michael Lingzhi Li.

# Teaching
**Graduate Teaching Assistant, JHU**
- EN.553.744 Data Science Methods for Large-Scale Graphs (Spring 2025)
- EN.553.642 Investment Science (Fall 2024&2025)

**Undergraduate Student Teaching Fellow, CUHK(SZ)**
- MAT2002 Ordinary Differential Equations (Spring 2024)
- MAT3007 Optimization (Fall 2023)

# Awards
- International Conference on Continuous Optimization (ICCOPT) 2025 Student Grant 

# Education

<style>
  .edu-timeline {
    margin: 20px 0;
    padding-left: 25px;
    border-left: 3px solid #fbbf24; /* 金黄色竖线 */
  }
  .edu-item {
    position: relative;
    margin-bottom: 24px;
    padding-left: 18px;
  }
  .edu-item::before {
    content: "";
    position: absolute;
    left: -11px;
    top: 6px;
    width: 12px;
    height: 12px;
    background: #fbbf24;
    border-radius: 50%;
    border: 2px solid #fff;
  }
  .edu-degree {
    font-weight: 700;
    font-size: 1.05rem;
    margin-bottom: 2px;
  }
  .edu-school {
    color: #333;
    margin-bottom: 2px;
  }
  .edu-dates {
    font-style: italic;
    color: #555;
    font-size: 0.95rem;
  }
</style>

<div class="edu-timeline">

  <div class="edu-item">
    <div class="edu-degree">PhD, Applied Mathematics &amp; Statistics</div>
    <div class="edu-school">Johns Hopkins University</div>
    <div class="edu-dates">Aug 2024 – Present</div>
  </div>

  <div class="edu-item">
    <div class="edu-degree">BSc (First Class Honors), Mathematics &amp; Applied Mathematics</div>
    <div class="edu-school">The Chinese University of Hong Kong, Shenzhen</div>
    <div class="edu-dates">Sept 2020 – May 2024</div>
  </div>

  <div class="edu-item">
    <div class="edu-degree">Exchange Program, Mathematics</div>
    <div class="edu-school">Technical University of Munich</div>
    <div class="edu-dates">Apr 2023 – Aug 2023</div>
  </div>

</div>



<hr>
<div class="small">Last updated: August 22, 2025</div>
