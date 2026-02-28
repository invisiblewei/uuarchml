# uuarchml DSL 规范 v0.6

> **TL;DR** - 5种 node 类型，3种 block 类型，支持端口连接和分层标注

## 应用场景

**适用**：
- AI 设计芯片结构时表达设计意图
- 绘制设计框图，与人沟通对齐
- 文档中的图示补充，配合文字描述

**范围**：不限于完整芯片，可以是子系统、模块或小功能特性

**不适用**：
- 精确时序分析
- RTL 代码生成
- 物理布局设计

```yaml
name: my_design
blocks:
  top:
    type: top
    nodes:
      alu: { type: inst }
      sel: { type: mux, inputs: 2 }
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
annotations: { pipeline, highlight, notes }  # 可选：标注
```

---

## 2. 核心类型速查

### 2.1 Block 类型

| 类型 | 用途 | 特性 |
|------|------|------|
| `top` | 根节点 | 唯一入口，自动作为 root |
| `module` | 可复用模块 | 全局可实例化，可通过 conn 低成本转换为 func |
| `func` | 内部功能块 | 仅当前 block 内使用，可通过 conn 低成本转换为 module |

### 2.2 Node 类型（5种）

| 类型 | 参数 | 省略端口 |
|------|------|----------|
| `mux` | `inputs: n` | `in0~in{n-1}`, `out`, `sel` |
| `arbiter` | `masters: n` | `req0~req{n-1}`, `grant0~grant{n-1}` |
| `fifo` | `depth: n` | `enq`, `deq`, `full`, `empty` |
| `reg` | - | `in`, `out`, `en`, `rst` |
| `inst` | `block: id`（可省略）| 由 block 定义决定 |

**Node 定义格式**：`{node_id}: { type, ...params }`

```yaml
nodes:
  alu: { type: inst }              # block 省略，默认为 alu
  sel: { type: mux, inputs: 2 }    # 2 输入选择器
  buf: { type: fifo, depth: 4 }   # 深度 4 的 FIFO
```

---

## 3. 连接（conns）

### 3.1 连接格式

```yaml
conns:
  # 基础连接
  - from: node_id, to: node_id, sig: signal_name
  
  # 端口连接（可视化到指定位置）
  - from: node:port, to: node:port, sig: name
  
  # 跨层级（路径语法）
  - from: block.node, to: node, sig: name
  
  # 带标注引用
  - id: conn_name, from: a, to: b, sig: name, width: 32
```

### 3.2 端口语法

| 语法 | 含义 | 示例 |
|------|------|------|
| `node` | 省略端口 | `alu` → 省略端口，按 sig name 匹配 |
| `node:port` | 指定端口 | `mux1:sel` → mux1 的 sel 端口 |
| `block.node` | 跨层级 | `fetch.pc` → fetch block 内的 pc |

**端口省略逻辑**：跨层连接时，若省略端口，可用 sig name 作为端口名匹配。

### 3.3 连接字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `from` | string | 是 | 源：node / node:port / block.node |
| `to` | string | 是 | 目标：同上 |
| `sig` | string | 条件 | 信号名（与 interface 二选一）|
| `interface` | string | 条件 | 引用预定义接口 |
| `width` | number | 否 | 位宽 |
| `id` | string | 否 | 用于 highlight 引用 |

---

## 4. 接口定义（interfaces）

```yaml
interfaces:
  axi4_if:                       # interface name
    label: "AXI4"               # 可选：显示名称
    signals:                     # 可选：可酌情省略
      - { name: awaddr, width: 32, direction: out }
      - { name: rdata, width: 32, direction: in }
```

**Signal 字段**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 信号名 |
| `width` | number | 是 | 位宽 |
| `direction` | string | 是 | 方向：`in`/`out`/`inout` |

---

## 5. 标注层（annotations）

### 5.1 Pipeline（流水线）

```yaml
annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, label: "Fetch", nodes: [fetch, pc] }
      - { name: EX, label: "Execute", nodes: [alu] }
    registers:
      - { between: [IF, EX], label: "IF/EX" }
```

### 5.2 Highlight（高亮）

```yaml
highlight:
  - type: path                    # 或 range
    name: critical_path
    targets: [conn_id, node_id]   # path 可混合 conn/node
    color: red
    style: thick                  # thick / dashed
    label: "~800ps"
```

### 5.3 Notes（注释）

```yaml
notes:
  - { type: note, target: node_id, text: "注释", anchor: bottom }
```

---

## 6. 完整最小示例

```yaml
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
```

---

## 7. 常见模式

### 7.1 旁路网络（Bypass）

```yaml
nodes:
  exe: { type: inst }
  mem: { type: inst }
  sel: { type: mux, inputs: 3 }   # 3 输入选择旁路
conns:
  - from: exe
    to: sel:in0
    sig: bypass_exe  # EX→EX 旁路
  - from: mem
    to: sel:in1
    sig: bypass_mem  # MEM→EX 旁路
```

### 7.2 内存仲裁

```yaml
nodes:
  imem: { type: inst, block: mem_port }
  dmem: { type: inst, block: mem_port }
  arb: { type: arbiter, masters: 2 }
conns:
  - from: imem
    to: arb:req0
    interface: axi4_if
  - from: dmem
    to: arb:req1
    interface: axi4_if
```

---

## 8. 设计原则

1. **简洁表达**：省略冗余信息，如 inst 的 block 与 node id 一致时可省略
2. **分层引用**：用 `block.node` 跨层级，用 `node:port` 精确连接
3. **标注分离**：核心结构（blocks/nodes/conns）与标注（annotations）分离
4. **按需细化**：文档中可补充详细说明，DSL 仅保留设计表达必要信息

---

*版本: 0.6.0 | 规范更新日期: 2026-02-28*
