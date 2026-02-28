# uuarchml DSL v0.6

```yaml
# 最小示例
chip: cpu
blocks:
  top:
    type: top
    nodes:
      alu: { type: inst }
      sel: { type: mux, inputs: 2 }
    conns:
      - { from: sel:out, to: alu:in0, sig: op }
```

---

## 速查表

### Block 类型（3种）
| 类型 | 用途 | 复用性 |
|------|------|--------|
| `top` | 根节点 | 唯一入口 |
| `module` | 可复用模块 | 全局可实例化 |
| `func` | 内部功能块 | 仅当前 block |

### Node 类型（5种）
| 类型 | 参数 | 端口 |
|------|------|------|
| `mux` | `inputs: n` | `in0~n-1`, `out`, `sel` |
| `arbiter` | `masters: n` | `req0~n-1`, `grant0~n-1` |
| `fifo` | `depth: n` | `enq`, `deq`, `full`, `empty` |
| `reg` | - | `in`, `out`, `en`, `rst` |
| `inst` | `block: id`（可省略）| 由 block 定义 |

### 连接语法
| 语法 | 含义 | 示例 |
|------|------|------|
| `node` | 默认端口 | `alu` |
| `node:port` | 指定端口 | `mux1:sel` |
| `block.node` | 跨层级 | `fetch.pc` |

---

## 文件结构

```yaml
chip: string                    # 必需
metadata: { version, description }  # 可选
interfaces: { [id]: {...} }     # 可选
blocks: { [id]: {...} }         # 必需
annotations: {...}              # 可选
```

### 字段类型
- `chip`: string
- `metadata`: object
- `interfaces`: object (key = interface id)
- `blocks`: object (key = block id)
- `annotations`: object

---

## Block 定义

```yaml
blocks:
  {block_id}:                   # id 作为 key
    type: top|module|func       # 必需
    label: string               # 可选
    nodes: { [id]: {...} }      # 可选，key = node id
    conns: [...]                # 可选
```

### Node 定义
```yaml
nodes:
  {node_id}:                    # id 作为 key
    type: mux|arbiter|fifo|reg|inst  # 必需
    # type=mux 时
    inputs: number              # 输入路数
    # type=arbiter 时
    masters: number             # 主设备数
    # type=fifo 时
    depth: number               # 队列深度
    # type=inst 时（可省略）
    block: string               # 引用的 block id
```

**注意**：`inst` 的 `block` 与 `node_id` 一致时可省略。

---

## 连接（conns）

```yaml
conns:
  # 基础连接
  - { from: node, to: node, sig: name }
  
  # 端口连接
  - { from: node:port, to: node:port, sig: name }
  
  # 跨层级
  - { from: block.node, to: node, sig: name }
  
  # 完整字段
  - id: string                  # 可选，用于 highlight
    from: string                # 必需
    to: string                  # 必需
    sig: string                 # 与 interface 二选一
    interface: string           # 引用预定义接口
    width: number               # 可选
```

### 字段类型
- `from`, `to`, `sig`, `interface`, `id`: string
- `width`: number

---

## 接口定义

```yaml
interfaces:
  {interface_id}:               # id 作为 key
    label: string               # 可选
    signals:
      - { name: string, width: number, direction: in|out|inout }
```

---

## 标注层

### Pipeline
```yaml
annotations:
  pipeline:
    name: string
    stages:
      - { name: string, label: string, nodes: [id, ...] }
    registers:
      - { between: [stage1, stage2], label: string }
```

### Highlight
```yaml
highlight:
  - type: path|range
    name: string
    targets: [id, ...]          # conn id 或 node id
    color: string               # 可选
    style: thick|dashed         # 可选
    label: string               # 可选
```

### Notes
```yaml
notes:
  - { type: note, target: id, text: string, anchor: top|bottom|left|right }
```

---

## 常见模式

### 旁路网络
```yaml
nodes:
  exe: { type: inst }
  mem: { type: inst }
  sel: { type: mux, inputs: 3 }
conns:
  - { from: exe, to: sel:in0, sig: bypass_exe }
  - { from: mem, to: sel:in1, sig: bypass_mem }
```

### 内存仲裁
```yaml
nodes:
  imem: { type: inst, block: mem_port }
  dmem: { type: inst, block: mem_port }
  arb: { type: arbiter, masters: 2 }
conns:
  - { from: imem, to: arb:req0, interface: axi4_if }
  - { from: dmem, to: arb:req1, interface: axi4_if }
```

### 流水线标注
```yaml
annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, nodes: [fetch] }
      - { name: ID, nodes: [decode] }
      - { name: EX, nodes: [alu] }
    registers:
      - { between: [IF, ID], label: "IF/ID" }
```

---

## 完整示例

```yaml
chip: riscv_cpu
metadata:
  version: "1.0"
  description: "5-stage RISC-V CPU"

interfaces:
  axi4_if:
    label: "AXI4"
    signals:
      - { name: awaddr, width: 32, direction: out }
      - { name: rdata, width: 32, direction: in }

blocks:
  riscv_top:
    type: top
    label: "RISC-V CPU"
    nodes:
      pc_reg: { type: inst }
      imem_port: { type: inst, block: mem_port }
      decode: { type: inst }
      regfile: { type: inst }
      op1_sel: { type: mux, inputs: 3 }
      op2_sel: { type: mux, inputs: 3 }
      execute: { type: inst }
      memory: { type: inst }
      mem_arb: { type: arbiter, masters: 2 }
      dmem_port: { type: inst, block: mem_port }
      writeback: { type: inst }
    conns:
      - { from: pc_reg, to: imem_port, sig: pc, width: 32 }
      - { from: imem_port, to: decode, interface: axi4_if }
      - { from: regfile, to: op1_sel, sig: rs1_data }
      - { from: op1_sel, to: execute, sig: operand1 }
      - { from: execute, to: memory, sig: alu_result }
      - { from: writeback, to: regfile, sig: rd_data }
      - { id: bypass_ex, from: execute, to: op1_sel, sig: bypass_ex }
      - { from: imem_port, to: mem_arb, interface: axi4_if }

  mem_port:
    type: module
    label: "Memory Port"
    nodes: {}
    conns: {}

annotations:
  pipeline:
    name: main
    stages:
      - { name: IF, label: "Fetch", nodes: [pc_reg, imem_port] }
      - { name: ID, label: "Decode", nodes: [decode, regfile] }
      - { name: EX, label: "Execute", nodes: [op1_sel, op2_sel, execute] }
      - { name: MEM, label: "Memory", nodes: [memory, mem_arb, dmem_port] }
      - { name: WB, label: "Writeback", nodes: [writeback] }
    registers:
      - { between: [IF, ID], label: "IF/ID" }
      - { between: [ID, EX], label: "ID/EX" }
      - { between: [EX, MEM], label: "EX/MEM" }
      - { between: [MEM, WB], label: "MEM/WB" }
  highlight:
    - { type: path, name: critical_path, targets: [bypass_ex], color: red }
```

---

## 设计原则

1. **id 作为 key**：blocks、nodes、interfaces 都用 dict
2. **省略即默认**：inst 的 block 与 node id 一致时可省略
3. **分层引用**：`block.node` 跨层级，`node:port` 精确连接
4. **结构分离**：blocks/nodes/conns 与 annotations 分离

---

*版本: 0.6.0 | 2026-02-28*
