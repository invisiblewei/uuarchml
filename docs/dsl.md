# uuarchml DSL 规范 v0.7.1

> **TL;DR** — 架构意图驱动的制图 DSL。拓扑、标注、布局三层分离，用结构化 YAML 描述芯片架构，生成框图辅助设计沟通。专注于"画什么"而非"怎么实现"。

## 设计哲学

**定位**：框图是沟通工具，不是实现规范。按需省略，降低描述开销。

| 层级 | 作用 | 示例 |
|------|------|------|
| **拓扑结构** (`blocks/nodes/conns`) | 有什么、连什么 | ALU 有两个输入、连接寄存器堆 |
| **视觉标注** (`annotations`) | 框图上的标记指引 | ①②③标签、关键路径高亮 |
| **布局引导** (`layout`) | 怎么画更清晰 | 数据流从左到右、相关模块对齐 |
| **文档补充** (Markdown 正文) | 为什么这样设计 | 时钟域划分、性能权衡、实现细节 |

## 应用场景

**适用**：表达架构意图，绘制框图辅助沟通。

**范围**：不限于完整芯片，可以是子系统、模块或小功能特性。

**不适用**：精确时序分析、RTL 代码生成、物理布局设计。

```yaml
name: my_design
blocks:
  top:
    type: top
    ports:                           # 芯片边界（仅 top 类型）
      clk: in
      rst_n: in
    nodes:
      alu: { type: inst }            # 功能单元
      sel: { type: mux, inputs: 2 }  # 2 输入选择器
    conns:
      - from: sel:out, to: alu:in0, sig: operand
```

---

## 1. 文件结构

```yaml
name: string                    # 必需：设计名称
metadata: { version, description }  # 可选
interfaces: { [id]: {...} }     # 可选：全局接口定义
blocks: { [id]: {...} }         # 必需：模块定义
annotations: { pipeline, highlight, notes }  # 可选：视觉标注
layout: { direction, hints }    # 可选：布局引导
```

**分层**：`blocks`（结构）、`annotations`（视觉层）、`layout`（渲染建议）

---

## 2. 拓扑描述

### 2.1 Block 类型

| 类型 | 用途 | 特性 |
|------|------|------|
| `top` | 根节点 | 唯一入口，自动作为 root |
| `module` | 可复用模块 | 全局可实例化 |
| `func` | 内部功能块 | 仅当前 block 内使用 |

**Block 字段**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 是 | block 类型: `top`/`module`/`func` |
| `label` | string | 否 | 显示名称，用于渲染时替代 block_id |
| `desc` | string | 否 | 一句话描述设计意图 |
| `logic` | string | 否 | 内部算法/状态机描述（多行文本）|
| `ports` | dict | 否 | **仅 top 类型**，定义芯片边界端口 |
| `nodes` | dict | 否 | 内部图元定义 |
| `conns` | list | 否 | 内部连接定义 |

> **关于 `logic` 字段**：建议**单行**描述核心意图（如 `"result = case(alu_op, ADD->a+b, ...)"`）。
> 复杂实现细节请写在 Markdown 正文，保持 DSL 关注拓扑结构。

### 2.2 Node 类型

| 类型 | 参数 | 说明 |
|------|------|------|
| `inst` | `block: id`（可省略）| 省略时渲染为通用方框 |
| `reg` | - | 寄存器符号 |
| `mux` | `inputs: n` | 多路选择器 |
| `arbiter` | `masters: n` | 仲裁器 |
| `fifo` | `depth: n` | 先进先出队列 |

```yaml
nodes:
  alu: { type: inst }
  sel: { type: mux, inputs: 2 }
  core: { type: inst, block: cpu_core, replica: 4 }
```

| 字段 | 说明 |
|------|------|
| `type` | node 类型 |
| `block` | 引用的 block 类型 |
| `replica` | 实例数量（默认 1）|

---

### 2.3 连接语法

**节点访问**：

| 语法 | 说明 |
|------|------|
| `node` | 单实例简写；或多实例时指所有实例 |
| `node[N]` | 第 N 个实例 |
| `node[M..N]` | 索引范围（可选）|

**连接格式**：

```yaml
conns:
  # 行内语法（单个连接）
  - from: node_id, to: node_id, sig: name
  - from: node:port, to: node:port, sig: name

  # 多行语法（需额外字段时）
  - from: core
    to: bank
    sig: data
    map: hash(addr)  # one-to-one/broadcast/all2all/expr
```

| map 规则 | 行为 |
|----------|------|
| `broadcast`（默认）| 单端连到多端所有实例 |
| `one-to-one` | 同索引一对一 |
| `all2all` | 每对实例全连接 |
| `<expr>` | 自定义函数 |

**端口规则**：

| 语法 | 说明 |
|------|------|
| `node` | 连线指向节点边缘 |
| `node:port` | 虚拟锚点，无需预先声明 |
| `block.node` | 跨层级访问 |

**Top 类型的 Ports**（芯片边界）：

仅 `type: top` 支持 `ports` 定义芯片边界。

```yaml
blocks:
  riscv_top:
    type: top
    ports:
      clk: in
      axi_mst: { dir: out, interface: axi4_if }
```

---

### 2.4 接口定义

```yaml
interfaces:
  axi4_if:
    label: "AXI4"
    signals:
      - { name: awaddr, width: 32, direction: out }
```

| 字段 | 说明 |
|------|------|
| `name` | 信号名 |
| `width` | 位宽 |
| `direction` | `in`/`out`/`inout` |

---

## 3. 标注层（annotations）

标注层仅提供**视觉指引**，复杂说明配合文档正文。建议用简洁标签（如"①""关键路径"），详细解释写在 Markdown 中。

### 3.1 Pipeline（流水线标注）

```yaml
annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, nodes: [fetch] }
      - { name: EX, nodes: [alu] }
    registers:
      - { between: [IF, EX], label: "IF/EX" }
```

| 字段 | 说明 |
|------|------|
| `stages` | 阶段列表，`name` 用于 registers 引用 |
| `registers` | 阶段间寄存器标注，`between: [from, to]` |

### 3.2 Highlight（高亮）

类型：`path`（路径）、`range`（区域）

```yaml
highlight:
  - { type: path, targets: [conn_a], label: "①" }  # 文档中说明①的含义
  - { type: range, targets: [node1, node2], label: "旁路网络" }
```

| 字段 | 说明 |
|------|------|
| `targets` | 目标列表（node_id 或 conn_id）|
| `color` | 颜色名或十六进制 |
| `style` | 线条样式：`thick`/`dashed`（path）|
| `opacity` | 填充透明度 0.0-1.0（range）|

### 3.3 Notes（注释）

```yaml
annotations:
  notes:
    - { target: alu, text: "①" }      # 文档中展开说明①的设计考量
    - { target: mem, text: "4KB" }    # 简洁标注，细节见正文
```

| 字段 | 说明 |
|------|------|
| `target` | 目标 node_id 或 conn_id |
| `text` | 注释内容，支持 `\n` 换行 |
| `anchor` | 位置：`top`/`bottom`/`left`/`right`，默认 `bottom` |

---

## 4. 布局引导（layout）

`layout` 提供**建议性**布局指导，渲染器可忽略。拓扑是核心，布局是可牺牲的优化。

```yaml
layout:
  direction: LR              # 整体流向: LR(左→右) / TB(上→下) / RL / BT
  hints:
    # 主路径引导 — 建议将这些节点排在一条视觉流线上
    - type: main_path
      nodes: [bus_if, fsm, ecc_enc, buf]
      priority: high         # 可选: high/normal/low

    # 同级对齐 — 建议将这些节点放在同一水平/垂直层级
    - type: rank
      level: same
      nodes: [buf_a, buf_b, buf_c]

    # 区域聚集 — 建议将这些节点放在相近区域
    - type: cluster
      name: datapath
      nodes: [alu, shifter, mux_result]
      style: box             # 可选: box/round/none
```

**Layout 字段**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `direction` | string | 否 | 整体流向: `LR`/`TB`/`RL`/`BT`，默认 `TB` |
| `hints` | list | 否 | 布局提示列表 |

**Hint 类型**：

| type | 作用 | 附加字段 |
|------|------|----------|
| `main_path` | 主数据流/控制流路径 | `nodes`: node_id 列表, `priority`: high/normal/low |
| `rank` | 同级对齐 | `level`: same/min/max, `nodes`: node_id 列表 |
| `cluster` | 区域聚集 | `name`: 分组名, `nodes`: node_id 列表, `style`: 视觉样式 |

**降级策略**：
- 渲染器不支持某 hint 类型 → 静默忽略
- 节点不存在或 replica 索引越界 → 跳过该 hint，记录警告
- 多个 hint 冲突 → 按 `priority` 字段或定义顺序解决

---

## 5. 完整最小示例

```yaml
name: demo_cpu
blocks:
  cpu:
    type: top
    desc: "演示用简单 CPU，展示 v0.7 新特性"
    ports:
      clk: in
      rst_n: in
    nodes:
      fetch: { type: inst }
      decode: { type: inst }
      alu:
        type: inst
        block: alu_module
      sel: { type: mux, inputs: 2 }
      # 多实例节点示例
      core:
        type: inst
        block: cpu_core
        replica: 2
    conns:
      # 单个连接（行内语法）
      - from: fetch, to: decode, sig: instr
      - from: decode, to: sel:in0, sig: op_a
      - from: sel:out, to: alu, sig: operand
      # 批量连接（多行语法）
      - from: decode
        to: core[0..1]
        sig: instr_bundle

  alu_module:
    type: module
    desc: "32位整数ALU，支持加减法和比较"
    logic: "result = case(alu_op: ADD->a+b, SUB->a-b, SLT->(a<b))"
    nodes:
      exec: { type: inst }
    conns: []

layout:
  direction: LR
  hints:
    - type: main_path
      nodes: [fetch, decode, alu]
      priority: high

annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, nodes: [fetch] }
      - { name: EX, nodes: [alu] }
    registers:
      - { between: [IF, EX], label: "IF/EX" }
```

---

## 6. 常见模式

### 6.1 旁路网络（Bypass）

用虚拟端口区分连接位置：

```yaml
nodes:
  exe: { type: inst }
  sel: { type: mux, inputs: 2 }
conns:
  - from: exe, to: sel:in0, sig: bypass_path
  - from: mem_sys, to: sel:in1, sig: mem_data
```

### 6.2 内存仲裁

```yaml
nodes:
  imem: { type: inst }
  dmem: { type: inst }
  arb: { type: arbiter, masters: 2 }
conns:
  - from: imem, to: arb:req_i, interface: axi4_if
  - from: dmem, to: arb:req_d, interface: axi4_if
```

### 6.3 多实例与批量连接（Replica）

```yaml
nodes:
  core: { type: inst, block: cpu_core, replica: 4 }
  l2_bank: { type: inst, block: l2_cache, replica: 2 }
  xbar: { type: arbiter, masters: 4 }
conns:
  - from: core, to: xbar, sig: req, map: one-to-one
  - from: core, to: l2_bank, sig: data, map: hash(addr[7:6])
  - from: intc, to: core, sig: irq  # 广播
```

### 6.4 Func 与 Module 转换

仅 `type` 字段不同，其余结构完全一致：

```yaml
# func: 仅当前 block 内使用
alu_inner:
  type: func  # 改为 module 即全局可复用
  nodes:
    alu: { type: inst }
  conns:
    - from: alu, to: dst, sig: result
```

---

## 7. 实现状态

| 特性类别 | 元素 | 状态 | 说明 |
|---------|------|------|------|
| **拓扑结构** | blocks/nodes/conns | ✅ 已渲染 | 完整支持 |
| | interfaces | ✅ 已渲染 | 完整支持 |
| | replica/bulk conns | ✅ 已渲染 | 预处理器展开后渲染 |
| **布局** | `layout.direction` | ✅ 已渲染 | LR/TB/RL/BT |
| | `layout.hints` | ⚠️ 解析但未渲染 | 类型定义存在，渲染器忽略 |
| **标注** | `annotations.pipeline` | ⚠️ 解析但未渲染 | 流水线阶段背景、寄存器标记 |
| | `annotations.highlight` | ⚠️ 解析但未渲染 | 路径/区域高亮 |
| | `annotations.notes` | ⚠️ 解析但未渲染 | 节点旁注释文本 |

**注意**：标注层特性目前仅做语法解析和类型校验，不会出现在最终 SVG 中。如需这些视觉效果，请等待后续版本或自行添加后期处理。

---

*版本: 0.7.1 | 规范更新日期: 2026-03-04*
