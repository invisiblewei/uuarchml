# ChipViz 设计文档 v0.6

**版本**: 0.6.0  
**日期**: 2026-02-26  
**状态**: 迭代中

---

## 1. 项目目标

ChipViz 是一个芯片微架构可视化工具，用于**模块设计早期**的架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

### 1.1 核心定位

- **阶段**: 模块设计早期（微架构定义阶段）
- **用户**: 芯片架构师、设计工程师、验证工程师
- **场景**: 设计评审、方案讨论、文档沉淀、新人培训

### 1.2 明确不做

| 不做 | 原因 |
|------|------|
| 交互式编辑 | 静态图足够表达设计意图，降低复杂度 |
| RTL 代码生成 | 专注可视化，不替代实现 |
| 精确时序分析 | 仅支持逻辑级数/延迟的粗略估计 |
| 物理布局 | 不做 floorplan，只做逻辑结构 |

---

## 2. 核心概念

### 2.1 设计哲学

**结构优先，标注分层**

- **核心层**: blocks、interfaces、nodes、conns
- **标注层**: pipeline、highlight、notes

### 2.2 层级结构

```
chip
├── interfaces     # 预声明接口定义（全局）
│   └── axi4_if
└── blocks         # 模块/功能块定义
    ├── top        # type: top，根节点
    ├── fetch      # type: module，可复用模块
    └── alu        # type: func，内部功能块
```

### 2.3 概念定义

| 概念 | 说明 | 示例 |
|------|------|------|
| **interface** | 预声明的信号组，用于总线/协议 | AXI4、AHB、自定义总线 |
| **block** | 设计单元，分 top/module/func 三种 | Fetch、ALU、Decode |
| **node** | block 内部的图元实例 | mux、arbiter、fifo、inst |

### 2.4 block 类型（3种）

| 类型 | 说明 | 复用性 |
|------|------|--------|
| **top** | 根节点，一个设计只有一个 | 不可复用 |
| **module** | 可复用模块，可被多处实例化 | 全局复用 |
| **func** | 内部功能块，仅在当前 block 内使用 | 局部使用 |

### 2.5 node 类型（4种）

用于 `nodes` 中的 `type` 字段：

| 类型 | 用途 | 参数 |
|------|------|------|
| **mux** | 多路选择器 | `inputs: 3` |
| **arbiter** | 仲裁器 | `masters: 2` |
| **fifo** | 队列 | `depth: 4` |
| **inst** | 实例化 block | `block: fetch` |

---

## 3. YAML DSL 规范 v0.6

### 3.1 文件结构

```yaml
chip: riscv_cpu

metadata:
  version: "1.0"
  description: "5-stage RISC-V CPU"

# 预声明接口（可选）
interfaces:
  - id: axi4_if
    signals: [...]

# 模块定义
blocks:
  - id: top
    type: top
    nodes: [...]
    conns: [...]
    
  - id: fetch
    type: module
    nodes: [...]
    conns: [...]
    
  - id: alu
    type: func
    nodes: [...]
    conns: [...]

# 标注层（可选）
annotations:
  pipeline: {}
  highlight: []
  notes: []
```

**顶层字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `chip` | 是 | 芯片/设计名称 |
| `metadata` | 否 | 版本、描述等元信息 |
| `interfaces` | 否 | 预声明接口定义（全局） |
| `blocks` | 是 | 模块/功能块定义列表 |
| `annotations` | 否 | 标注层，包含 pipeline、highlight、notes |

### 3.2 接口定义（interfaces）

预声明的信号组，用于复杂协议或总线。

**interfaces 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `id`（作为 key） | 是 | 接口唯一标识 |
| `label` | 否 | 显示名称 |
| `signals` | 是 | 信号列表 |

**signal 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 信号名 |
| `width` | 是 | 位宽 |
| `direction` | 是 | 方向：`in`/`out`/`inout` |

```yaml
interfaces:
  axi4_if:
    label: "AXI4"
    signals:
      - name: awaddr
        width: 32
        direction: out
      - name: wdata
        width: 32
        direction: out
      - name: rdata
        width: 32
        direction: in
```

### 3.3 模块定义（blocks）

**blocks 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `id`（作为 key） | 是 | 模块唯一标识 |
| `type` | 是 | 类型：`top`/`module`/`func` |
| `label` | 否 | 显示名称 |
| `nodes` | 否 | 内部图元列表 |
| `conns` | 否 | 内部连接列表 |

**node 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `id` | 是 | 图元唯一标识 |
| `type` | 是 | 类型：`mux`/`arbiter`/`fifo`/`inst` |
| `block` | 条件 | `type: inst` 时必需，引用的 block id |
| `inputs` | 条件 | `type: mux` 时可选，输入路数 |
| `masters` | 条件 | `type: arbiter` 时可选，主设备数 |
| `depth` | 条件 | `type: fifo` 时可选，队列深度 |

#### type: top — 根节点

```yaml
blocks:
  riscv_top:
    type: top
    label: "RISC-V CPU"
    nodes:
      - id: fetch
        type: inst
        block: fetch
      - id: decode
        type: inst
        block: decode
      - id: op1_sel
        type: mux
        inputs: 3
    conns:
      - from: fetch
        to: decode
        interface: axi4_if
```

#### type: module — 可复用模块

```yaml
blocks:
  fetch:
    type: module
    label: "Fetch Unit"
    nodes:
      - id: pc_reg
        type: inst
        block: pc_reg
    conns:
      - from: pc_reg
        to: imem_port
        sig: pc
```

#### type: func — 内部功能块

```yaml
blocks:
  alu:
    type: func
    label: "ALU Core"
    nodes:
      - id: op1_sel
        type: mux
        inputs: 3
      - id: adder
        type: inst
        module: adder
    conns:
      - from: op1_sel
        to: adder
        sig: operand
        width: 32
```

### 3.4 顶层实例（root）

type: top 的 block 自动作为设计根节点，无需额外 root 声明。

### 3.5 连接定义（conns）

三种 block 类型（top/module/func）都支持相同的连接方式。

**conns 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `id` | 否 | 可选，用于标注引用 |
| `from` | 是 | node id 或路径（如 `block.node`） |
| `to` | 是 | node id 或路径（如 `block.node`） |
| `interface` | 条件 | 引用预声明的 interface |
| `sig` | 条件 | 单信号名 |
| `name` | 否 | interface 实例名 |
| `width` | 否 | 位宽 |
| `type` | 否 | 信号类型 |

```yaml
conns:
  # 通过 interface 连接
  - id: mem_bus
    from: fetch
    to: mem_ctrl
    interface: axi4_if
    name: if_req

  # 通过 sig 连接
  - id: bypass_ex_conn
    from: execute
    to: op1_sel
    sig: bypass_ex
    width: 32
    type: bypass

  # 跨层级连接（使用路径表示法）
  - from: fetch.pc_reg
    to: decode
    sig: pc_plus4
```

---

## 4. 标注层（可选）

标注层统一放在 `annotations` 下：

```yaml
annotations:
  pipeline: {}
  highlight: []
  notes: []
```

### 4.1 流水线阶段标注（pipeline）

**pipeline 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 流水线名称 |
| `stages` | 是 | 阶段列表 |
| `registers` | 否 | 寄存器列表 |

**stage 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 阶段标识（如 IF、ID、EX） |
| `label` | 否 | 显示名称 |
| `nodes` | 是 | 该阶段包含的 node id 列表 |

**register 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `between` | 是 | 相邻阶段名列表，如 `[IF, ID]` |
| `label` | 否 | 寄存器显示名称 |

```yaml
pipeline:
  name: main
  stages:
    - name: IF
      label: "Instruction Fetch"
      nodes: [fetch]
    - name: ID
      label: "Decode"
      nodes: [decode]
    - name: EX
      label: "Execute"
      nodes: [op1_sel, execute]

  registers:
    - between: [IF, ID]
      label: "IF/ID"
```

### 4.2 高亮标注（highlight）

**highlight 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `type` | 是 | 类型：`path`/`range` |
| `name` | 是 | 高亮名称 |
| `targets` | 是 | 目标 id 列表 |
| `color` | 否 | 颜色 |
| `style` | 否 | 样式：`thick`/`dashed` 等 |
| `label` | 否 | 显示标签 |
| `delay` | 否 | 延迟标注 |
| `opacity` | 否 | 透明度（0-1） |

| 类型 | targets 要求 | 用途 |
|------|-------------|------|
| **path** | conn id 列表 或 node id 列表 | 高亮信号路径。node id 列表如 `[a b c]` 表示 `node a -> node b -> node c` 的路径 |
| **range** | conn id 或 node id 列表 | 高亮区域 |

```yaml
highlight:
  - type: path
    name: critical_path
    targets: [bypass_ex_conn]
    color: red
    style: thick
    label: "EX→EX Bypass ~800ps"
    delay: "~200ps"

  - type: range
    name: bypass_network
    targets: [op1_sel, op2_sel, bypass_ex_conn]
    color: blue
    opacity: 0.15
    label: "旁路网络"
```

### 4.3 文本注释（notes）

**notes 字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `type` | 是 | 类型：`note` |
| `target` | 是 | 目标 node id 或 conn id |
| `text` | 是 | 注释文本 |
| `anchor` | 否 | 锚点位置：`top`/`bottom`/`left`/`right` |

```yaml
notes:
  - type: note
    target: mem_arb
    text: "Round-robin 仲裁"
    anchor: bottom

  - type: note
    target: bypass_ex_conn
    text: "关键路径 ~800ps"
    anchor: top
```

---

## 5. 完整示例：RISC-V 五级流水线

```yaml
chip: riscv_cpu

metadata:
  version: "1.0"
  description: "经典 5 级流水线 RISC-V CPU"

# ═══════════════════════════════════════════════════
# 预声明接口
# ═══════════════════════════════════════════════════

interfaces:
  axi4_if:
    label: "AXI4"
    signals:
      - name: awaddr
        width: 32
        direction: out
      - name: wdata
        width: 32
        direction: out
      - name: rdata
        width: 32
        direction: in

# ═══════════════════════════════════════════════════
# 模块定义（含顶层）
# ═══════════════════════════════════════════════════

blocks:
  # ── 根节点 ──
  riscv_top:
    type: top
    label: "RISC-V CPU"
    nodes:
      # IF Stage
      - id: pc_reg
        type: inst
        block: pc_reg
      - id: imem_port
        type: inst
        block: mem_port

      # ID Stage
      - id: decode
        type: inst
        block: decode
      - id: regfile
        type: inst
        block: regfile

      # EX Stage
      - id: op1_sel
        type: mux
        inputs: 3
      - id: op2_sel
        type: mux
        inputs: 3
      - id: execute
        type: inst
        block: execute

      # MEM Stage
      - id: memory
        type: inst
        block: memory
      - id: mem_arb
        type: arbiter
        masters: 2
      - id: dmem_port
        type: inst
        block: mem_port

      # WB Stage
      - id: writeback
        type: inst
        block: writeback

    conns:
      # IF → ID
      - from: pc_reg
        to: imem_port
        sig: pc
        width: 32

      - from: imem_port
        to: decode
        interface: axi4_if
        name: instr_fetch

      - from: decode
        to: regfile
        sig: rs_addr
        width: 10
        type: control

      # ID → EX
      - from: regfile
        to: op1_sel
        sig: rs1_data
        width: 32
        type: data

      - from: regfile
        to: op2_sel
        sig: rs2_data
        width: 32
        type: data

      - from: op1_sel
        to: execute
        sig: operand1
        width: 32
        type: data

      - from: op2_sel
        to: execute
        sig: operand2
        width: 32
        type: data

      # EX → MEM
      - from: execute
        to: memory
        sig: alu_result
        width: 32
        type: data

      - from: memory
        to: dmem_port
        interface: axi4_if
        name: data_access

      # MEM → WB
      - from: memory
        to: writeback
        sig: mem_data
        width: 32
        type: data

      # WB → ID
      - from: writeback
        to: regfile
        sig: rd_data
        width: 32
        type: data

      # 旁路网络
      - id: bypass_ex_conn
        from: execute
        to: op1_sel
        sig: bypass_ex
        width: 32
        type: bypass

      - id: bypass_ex2_conn
        from: execute
        to: op2_sel
        sig: bypass_ex2
        width: 32
        type: bypass

      - id: bypass_mem_conn
        from: memory
        to: op1_sel
        sig: bypass_mem
        width: 32
        type: bypass

      - id: bypass_mem2_conn
        from: memory
        to: op2_sel
        sig: bypass_mem2
        width: 32
        type: bypass

      # 内存仲裁
      - from: imem_port
        to: mem_arb
        interface: axi4_if
        name: if_req

      - from: dmem_port
        to: mem_arb
        interface: axi4_if
        name: lsu_req

  # ── 可复用模块 ──
  fetch:
    type: module
    label: "Fetch Unit"
    nodes: []
    conns: []

  decode:
    type: module
    label: "Decode Unit"
    nodes: []
    conns: []

  execute:
    type: module
    label: "Execute Unit"
    nodes: []
    conns: []

  memory:
    type: module
    label: "Memory Unit"
    nodes: []
    conns: []

  writeback:
    type: module
    label: "Writeback Unit"
    nodes: []
    conns: []

  regfile:
    type: module
    label: "Register File"
    nodes: []
    conns: []

  pc_reg:
    type: module
    label: "PC Register"
    nodes: []
    conns: []

  mem_port:
    type: module
    label: "Memory Port"
    nodes: []
    conns: []

# ═══════════════════════════════════════════════════
# 标注层
# ═══════════════════════════════════════════════════

annotations:
  pipeline:
    name: main
    stages:
      - name: IF
        label: "Instruction Fetch"
        nodes: [pc_reg, imem_port]
      - name: ID
        label: "Decode"
        nodes: [decode, regfile]
      - name: EX
        label: "Execute"
        nodes: [op1_sel, op2_sel, execute]
      - name: MEM
        label: "Memory"
        nodes: [memory, mem_arb, dmem_port]
      - name: WB
        label: "Write Back"
        nodes: [writeback]

    registers:
      - between: [IF, ID]
        label: "IF/ID"
      - between: [ID, EX]
        label: "ID/EX"
      - between: [EX, MEM]
        label: "EX/MEM"
      - between: [MEM, WB]
        label: "MEM/WB"

    latency: 5

  highlight:
    - type: path
      name: critical_path
      targets: [bypass_ex_conn]
      color: red
      style: thick
      label: "EX→EX Bypass ~800ps"
      delay: "~200ps"

    - type: range
      name: bypass_network
      targets: [op1_sel, op2_sel, bypass_ex_conn, bypass_ex2_conn, bypass_mem_conn, bypass_mem2_conn]
      color: blue
      opacity: 0.15
      label: "3-to-1 旁路选择器"

  notes:
    - type: note
      target: mem_arb
      text: "Round-robin 仲裁\nIF 优先级更高"
      anchor: bottom
```

---

## 6. 输出格式

1. **SVG** — 矢量图，可缩放，可嵌入文档
2. **PNG** — 位图，方便分享
3. **Mermaid** — 文本格式，版本控制友好

---

## 7. 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| DSL | YAML | 简洁、易读、工具生态好 |
| 解析 | js-yaml | YAML 解析器 |
| 渲染 | 自定义 SVG | 精确控制流水线布局 |
| 构建 | Vite | 开发服务器 + 打包 |

---

## 8. 里程碑

### Phase 1: MVP
- [x] YAML DSL 设计 v0.6
- [ ] YAML 解析器（js-yaml）
- [ ] 基础布局引擎（网格 + 流水线）
- [ ] 4种基础图元 + inst 渲染

### Phase 2: 完善
- [ ] 层级展开/折叠
- [ ] 信号路由（避免重叠）
- [ ] 关键路径高亮
- [ ] 主题切换

### Phase 3: 进阶
- [ ] 导出 PNG/SVG
- [ ] Mermaid 双向转换
- [ ] 动画演示

---

## 9. 参考

- **参考图**: 经典计算机体系结构教材 RISC-V datapath 图
- **Mermaid**: https://mermaid.js.org/
- **RISC-V Spec**: https://riscv.org/technical/specifications/

---

*本文档随项目迭代更新*
