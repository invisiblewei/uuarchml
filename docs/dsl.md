# uuarchml DSL 规范 v0.6

> **TL;DR** — 架构意图驱动的制图 DSL。采用"逻辑拓扑 + 视觉标注"分离模式，支持通过虚拟锚点（Virtual Anchors）定义非物理连接位置。不用于 RTL 生成，旨在通过结构化表达实现芯片架构的快速可视化与人机设计对齐。

\`\`\`yaml
name: my_design
blocks:
  top:
    type: top
    nodes:
      alu: { type: inst }              # 通用功能方框
      sel: { type: mux, inputs: 2 }    # 2 输入选择器
    conns:
      - from: sel:out, to: alu:in0, sig: operand
\`\`\`

## 应用场景

**适用**：AI 设计芯片结构时表达设计意图，绘制设计框图与人沟通对齐，作为文档中的图示补充。

**范围**：不限于完整芯片，可以是子系统、模块或小功能特性。

**不适用**：精确时序分析、RTL 代码生成、物理布局设计。

---

## 1. 文件结构

\`\`\`yaml
name: string                    # 必需：设计名称
metadata: { version, description }  # 可选
interfaces: { [id]: {...} }     # 可选：全局接口定义
blocks: { [id]: {...} }         # 必需：模块定义
annotations: { pipeline, highlight, notes }  # 可选：标注
\`\`\`

---

## 2. 核心类型速查

### 2.1 Block 类型

| 类型 | 用途 | 特性 |
|------|------|------|
| \`top\` | 根节点 | 唯一入口，自动作为 root |
| \`module\` | 可复用模块 | 全局可实例化 |
| \`func\` | 内部功能块 | 仅当前 block 内使用 |

### 2.2 Node 类型（5种）

| 类型 | 参数 | 说明 |
|------|------|------|
| \`inst\` | \`block: id\`（可省略）| 省略时渲染为通用方框 |
| \`reg\` | - | 寄存器符号 |
| \`mux\` | \`inputs: n\` | 多路选择器 |
| \`arbiter\` | \`masters: n\` | 仲裁器 |
| \`fifo\` | \`depth: n\` | 先进先出队列 |

**Node 定义格式**：\`{node_id}: { type, ...params }\`

\`\`\`yaml
nodes:
  alu: { type: inst }              # 通用方框
  sel: { type: mux, inputs: 2 }    # 2 输入选择器
  buf: { type: fifo, depth: 4 }   # 深度 4 的 FIFO
\`\`\`

---

## 3. 连接与端口语法

### 3.1 连接格式

\`\`\`yaml
conns:
  # 基础连接（简洁表达）
  - from: node_id, to: node_id, sig: signal_name
  
  # 端口连接（创建虚拟锚点）
  - from: node:port, to: node:port, sig: name
  
  # 跨层级（路径语法）
  - from: block.node, to: node, sig: name
  
  # 带标注引用
  - id: conn_name, from: a, to: b, sig: name, width: 32
\`\`\`

### 3.2 端口与连线规则

| 语法 | 制图表现 | 应用场景 |
|------|----------|----------|
| \`node\` | 连线直接指向节点边缘中心，不绘制端口锚点 | 简洁表达 |
| \`node:port\` | 在节点边缘创建虚拟锚点并标注端口名 | 区分连接位置 |
| \`block.node\` | 连线穿透 Block 边界指向内部节点 | 跨层级路径 |

**隐式表达原则**：连线时不强制匹配物理端口，以最简洁的线对框形式呈现。

**临时端口**：\`node:any_name\` 中的 \`any_name\` 无需预先声明，仅作为位置占位引导。

### 3.3 连接字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| \`from\` | string | 是 | 源：\`node\` / \`node:port\` / \`block.node\` |
| \`to\` | string | 是 | 目标：同上 |
| \`sig\` | string | 条件 | 信号名（与 interface 二选一）|
| \`interface\` | string | 条件 | 引用预定义接口 |
| \`width\` | number | 否 | 位宽 |
| \`id\` | string | 否 | 用于 highlight 引用 |

---

## 4. 接口定义（interfaces）

\`\`\`yaml
interfaces:
  axi4_if:                       # interface id
    label: "AXI4"               # 可选：显示名称
    signals:                     # 可选：可酌情省略
      - { name: awaddr, width: 32, direction: out }
      - { name: rdata, width: 32, direction: in }
\`\`\`

**Signal 字段**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| \`name\` | string | 是 | 信号名 |
| \`width\` | number | 是 | 位宽 |
| \`direction\` | string | 是 | 方向：\`in\`/\`out\`/\`inout\` |

---

## 5. 标注层（annotations）

### 5.1 Pipeline（流水线标注）

\`pipeline\` 下的内容属于视觉覆盖层，不参与逻辑拓扑构建。

\`\`\`yaml
annotations:
  pipeline:
    name: main_pipe
    stages:
      - { name: IF, nodes: [fetch] }
      - { name: EX, nodes: [alu] }
    # registers 作为阶段间的视觉辅助线
    registers:
      - { between: [IF, EX], label: "IF/EX_Boundary" }
\`\`\`

### 5.2 Highlight（高亮）

\`\`\`yaml
highlight:
  - type: path                    # 或 range
    name: critical_path
    targets: [conn_id, node_id]   # path 可混合 conn/node
    color: red
    style: thick                  # thick / dashed
    label: "~800ps"
\`\`\`

### 5.3 Notes（注释）

\`\`\`yaml
notes:
  - { type: note, target: node_id, text: "注释", anchor: bottom }
\`\`\`

---

## 6. 完整最小示例

\`\`\`yaml
name: demo_cpu
blocks:
  cpu:
    type: top
    nodes:
      fetch: { type: inst }
      decode: { type: inst }
      alu: { type: inst }
      sel: { type: mux, inputs: 2 }
    conns:
      - from: fetch, to: decode, sig: instr
      - from: decode, to: sel:in0, sig: op_a
      - from: sel:out, to: alu, sig: operand
annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, nodes: [fetch] }
      - { name: EX, nodes: [alu] }
    registers:
      - { between: [IF, EX], label: "IF/EX" }
\`\`\`

---

## 7. 常见模式

### 7.1 旁路网络（Bypass）- 利用虚拟端口

**修订说明**：展示如何利用虚拟端口区分位置而不依赖硬件映射。

\`\`\`yaml
nodes:
  exe: { type: inst }
  sel: { type: mux, inputs: 2 }
conns:
  # 使用 in0/in1 区分连接位置
  - from: exe, to: sel:in0, sig: bypass_path
  - from: mem_sys, to: sel:in1, sig: mem_data
\`\`\`

### 7.2 内存仲裁

\`\`\`yaml
nodes:
  imem: { type: inst }
  dmem: { type: inst }
  arb: { type: arbiter, masters: 2 }
conns:
  # 使用虚拟端口 req_i/req_d 增加可读性
  - from: imem, to: arb:req_i, interface: axi4_if
  - from: dmem, to: arb:req_d, interface: axi4_if
\`\`\`

### 7.3 Func 与 Module 转换

通过添加 \`conn\` 低成本转换：

\`\`\`yaml
# 原 func 定义（带内部连接）
blocks:
  alu_func:
    type: func
    nodes:
      alu: { type: inst }
    conns:
      - from: alu, to: internal, sig: result

# 转换为 module（添加外部连接）
blocks:
  alu_module:
    type: module
    nodes:
      alu: { type: inst }
    conns:
      - from: alu, to: external, sig: result
\`\`\`

---

## 8. 设计原则

1. **简洁表达**：按需省略，降低描述开销
2. **分层引用**：用 \`block.node\` 跨层级，用 \`node:port\` 精确定位
3. **视图分离**：拓扑结构与视觉标注分离，标注不改变底层模型
4. **模型自洽**：确保连接、节点与标注语义一致

---

*版本: 0.6.1 | 规范更新日期: 2026-02-28*
