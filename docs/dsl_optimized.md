# uuarchml DSL v0.6

## 文件结构

```yaml
chip: string                    # 必需：设计名称
metadata: { version, description }  # 可选
interfaces: { [id]: {...} }     # 可选：全局接口定义
blocks: { [id]: {...} }         # 必需：模块定义
annotations: { pipeline, highlight, notes }  # 可选：标注
```

## Block 类型

| 类型 | 用途 | 特性 |
|------|------|------|
| `top` | 根节点 | 唯一入口，自动作为 root |
| `module` | 可复用模块 | 全局可实例化 |
| `func` | 内部功能块 | 仅当前 block 内使用 |

## Node 类型（5种）

| 类型 | 参数 | 默认端口 |
|------|------|----------|
| `mux` | `inputs: n` | `in0~in{n-1}`, `out`, `sel` |
| `arbiter` | `masters: n` | `req0~req{n-1}`, `grant0~grant{n-1}` |
| `fifo` | `depth: n` | `enq`, `deq`, `full`, `empty` |
| `reg` | - | `in`, `out`, `en`, `rst` |
| `inst` | `block: id`（可省略）| 由 block 定义决定 |

**Node 定义**：`{node_id}: { type, ...params }`

```yaml
nodes:
  alu: { type: inst }              # block 省略，默认为 alu
  sel: { type: mux, inputs: 2 }    # 2 输入选择器
  buf: { type: fifo, depth: 4 }   # 深度 4 的 FIFO
```

## 连接（conns）

```yaml
conns:
  # 基础连接
  - from: node_id, to: node_id, sig: signal_name
  
  # 端口连接
  - from: node:port, to: node:port, sig: name
  
  # 跨层级（路径语法）
  - from: block.node, to: node, sig: name
  
  # 带标注引用
  - id: conn_name, from: a, to: b, sig: name, width: 32
```

### 端口语法

| 语法 | 含义 | 示例 |
|------|------|------|
| `node` | 默认端口 | `alu` → alu 的默认端口 |
| `node:port` | 指定端口 | `mux1:sel` → mux1 的 sel 端口 |
| `block.node` | 跨层级 | `fetch.pc` → fetch block 内的 pc |

### 连接字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `from` | string | 是 | 源：node / node:port / block.node |
| `to` | string | 是 | 目标：同上 |
| `sig` | string | 条件 | 信号名（与 interface 二选一）|
| `interface` | string | 条件 | 引用预定义接口 |
| `width` | number | 否 | 位宽 |
| `id` | string | 否 | 用于 highlight 引用 |

## 接口定义（interfaces）

```yaml
interfaces:
  axi4_if:
    label: "AXI4"
    signals:
      - { name: awaddr, width: 32, direction: out }
      - { name: rdata, width: 32, direction: in }
```

**Signal 字段**：`name` (string), `width` (number), `direction` (in/out/inout)

## 标注层（annotations）

### Pipeline

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

### Highlight

```yaml
highlight:
  - type: path                    # 或 range
    name: critical_path
    targets: [conn_id, node_id]   # path 可混合 conn/node
    color: red
    style: thick                  # thick / dashed
    label: "~800ps"
```

### Notes

```yaml
notes:
  - { type: note, target: node_id, text: "注释", anchor: bottom }
```

## 完整示例

```yaml
chip: demo_cpu
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

## 设计原则

1. **id 作为 key**：blocks、nodes、interfaces 都用 dict，id 是 key
2. **省略即默认**：`inst` 的 block 与 node id 一致时可省略
3. **分层引用**：用 `block.node` 跨层级，用 `node:port` 精确连接
4. **标注分离**：核心结构（blocks/nodes/conns）与标注（annotations）分离

---

*版本: 0.6.0 | 更新日期: 2026-02-28*
