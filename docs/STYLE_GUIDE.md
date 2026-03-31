# uuarchml Style Guide v0.7.1

**兼容 DSL**: v0.7.1

---

## 1. 设计原则

### 1.1 核心原则

- **清晰优先**: 信息传递效率 > 视觉美观
- **减少认知负荷**: 一眼能看出数据流向和关键路径
- **工程师友好**: 符合芯片设计领域的视觉惯例

### 1.2 渲染原则

- 默认输出**紧凑、黑白**的框图
- 仅在添加标注时引入颜色和额外视觉元素
- 图元根据数据流方向自动旋转/镜像

---

## 2. 默认布局

**默认数据流向**: `LR` (左→右)

| 方向 | 说明 |
|------|------|
| `LR` | 左→右 (默认) |
| `RL` | 右→左 |
| `TB` | 上→下 |
| `BT` | 下→上 |

---

## 3. 图元形状

### 3.1 inst - 功能实例

简洁矩形，无标题栏，纯黑白。

<svg width="120" height="80" viewBox="0 0 120 80">
  <rect x="10" y="10" width="100" height="60" fill="white" stroke="black" stroke-width="2"/>
  <text x="60" y="45" text-anchor="middle" font-size="14">ALU</text>
</svg>

### 3.2 reg - 寄存器

边沿触发符号，带三角标记表示触发边沿。

<svg width="120" height="80" viewBox="0 0 120 80">
  <rect x="30" y="15" width="60" height="50" fill="white" stroke="black" stroke-width="2"/>
  <text x="60" y="45" text-anchor="middle" font-size="14">D</text>
  <text x="35" y="45" text-anchor="middle" font-size="10" fill="#666">&gt; </text>
</svg>

### 3.3 mux - 多路选择器

梯形，长边为输入侧，短边为输出侧，选择端(sel)垂直于数据流。

**LR 方向（默认）**: 输入在左(长边)，输出在右(短边)，sel在下

<svg width="120" height="100" viewBox="0 0 120 100">
  <polygon points="20,20 60,30 60,70 20,80" fill="white" stroke="black" stroke-width="2"/>
  <text x="25" y="42" font-size="10">0</text>
  <text x="25" y="68" font-size="10">1</text>
  <text x="70" y="52" font-size="10">out</text>
  <line x1="40" y1="75" x2="40" y2="95" stroke="black" stroke-width="1"/>
  <text x="45" y="92" font-size="10">sel</text>
</svg>

**mux 旋转规则**: 根据 `layout.direction` 自动旋转

| 方向 | 输入位置 | 输出位置 | sel 位置 |
|------|----------|----------|----------|
| `LR` | 左(长边) | 右(短边) | 下 |
| `RL` | 右(长边) | 左(短边) | 下 |
| `TB` | 上(长边) | 下(短边) | 右 |
| `BT` | 下(长边) | 上(短边) | 右 |

### 3.4 arbiter - 仲裁器

圆形，仲裁决策点。

<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="25" fill="white" stroke="black" stroke-width="2"/>
  <text x="50" y="55" text-anchor="middle" font-size="10">ARB</text>
  <line x1="10" y1="35" x2="25" y2="42" stroke="black" stroke-width="1"/>
  <line x1="10" y1="65" x2="25" y2="58" stroke="black" stroke-width="1"/>
  <line x1="75" y1="50" x2="90" y2="50" stroke="black" stroke-width="1"/>
</svg>

### 3.5 fifo - 队列

紧凑排列矩形，排列方向表示数据流方向。

<svg width="140" height="90" viewBox="0 0 140 90">
        <!-- 队列槽位表示 -->
        <rect x="25" y="35" width="20" height="20" fill="white" stroke="black" stroke-width="1"></rect>
        <rect x="50" y="35" width="20" height="20" fill="white" stroke="black" stroke-width="1"></rect>
        <rect x="75" y="35" width="20" height="20" fill="white" stroke="black" stroke-width="1"></rect>
        <!-- 输入箭头 -->
        <line x1="10" y1="45" x2="25" y2="45" stroke="black" stroke-width="1"></line>
        <polygon points="20,42 25,45 20,48" fill="black"></polygon>
        <text x="5" y="40" font-size="9">in</text>
        <!-- 输出箭头 -->
        <line x1="95" y1="45" x2="110" y2="45" stroke="black" stroke-width="1"></line>
        <polygon points="105,42 110,45 105,48" fill="black"></polygon>
        <text x="100" y="62" font-size="9">out</text>
        <text x="60" y="72" text-anchor="middle" font-size="9">depth=4</text>
      </svg>

### 3.6 端口锚点

使用方位缩写: `n`(上)、`s`(下)、`w`(左)、`e`(右)、`nw/ne/sw/se`(四角)

---

## 4. 连线

- 默认: 黑色实线，带箭头
- 信号类型(可选启用): data(蓝)、control(橙)、clock(紫)、reset(灰)、bypass(青虚线)、critical(红粗线)

---

## 5. 标注

- `pipeline`: 阶段分隔线、寄存器标记
- `highlight/path`: 路径加粗/虚线
- `highlight/range`: 半透明填充区域
- `notes`: 文字标签，位置由 anchor 方位指定

---

*版本: 0.7.1 | 2026-03-10*
