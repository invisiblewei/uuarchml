# ChipViz 设计文档 v0.5

**版本**: 0.5.0  
**日期**: 2026-02-26  
**状态**: 迭代中

---

## 1. 项目目标

ChipViz 是一个芯片微架构可视化工具，用于**模块设计早期**的架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

### 1.1 核心定位

- **阶段**: 微架构定义阶段（RTL 实现前）
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
├── interfaces     # 预声明接口定义
│   └── axi4_if
├── blocks         # 可复用模块定义
│   └── fetch
│       ├── nodes
│       └── conns
└── root           # 顶层实例化
    ├── nodes      # 图元实例
    └── conns      # 连接关系
```

### 2.3 概念定义

| 概念 | 说明 | 示例 |
|------|------|------|
| **interface** | 预声明的信号组，用于总线/协议 | AXI4、AHB、自定义总线 |
| **block** | 可复用模块定义，可嵌套 | Fetch、Decode、Execute |
| **node** | 基础图元实例 | mux、arbiter、fifo、block 实例 |

### 2.4 基础图元类型（4种）

用于 `nodes` 中的 `type` 字段：

| 类型 | 用途 | 参数 |
|------|------|------|
| **mux** | 多路选择器 | `inputs: 3` |
| **arbiter** | 仲裁器 | `masters: 2` |
| **fifo** | 队列 | `depth: 4` |
| **block** | 引用 block 定义 | `block: fetch` |

---

## 3. YAML DSL 规范 v0.5

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

# 模块定义（可选，用于复用和层级）
blocks:
  - id: fetch
    nodes: [...]
    conns: [...]

# 顶层实例化（必需）
root:
  nodes:
    - id: fetch_inst
      type: block
      block: fetch
  conns:
    - from: fetch_inst
      to: decode_inst

# 标注层（可选）
pipeline: {}
highlight: []
notes: []
```

### 3.2 接口定义（interfaces）

预声明的信号组，用于复杂协议或总线。

```yaml
interfaces:
  - id: axi4_if
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

  - id: simple_fifo
    label: "FIFO Port"
    signals:
      - name: data
        width: 32
      - name: valid
        width: 1
      - name: ready
        width: 1
```

### 3.3 模块定义（blocks）

可复用的模块，可包含内部 nodes 和 conns。

```yaml
blocks:
  - id: fetch
    label: "Fetch Unit"
    nodes:
      - id: pc_reg
        type: block
        block: pc_reg_block
      - id: imem_if
        type: interface
        interface: axi4_if
    conns:
      - from: pc_reg
        to: imem_if
        sig: pc

  - id: execute
    label: "Execute Unit"
    nodes:
      - id: op1_sel
        type: mux
        inputs: 3
      - id: alu
        type: block
        block: alu_core
    conns:
      - from: op1_sel
        to: alu
        sig: operand1
```

### 3.4 顶层实例化（root）

```yaml
root:
  nodes:
    # 引用 block 定义
    - id: fetch_inst
      type: block
      block: fetch
      
    - id: decode_inst
      type: block
      block: decode

    # 直接使用基础图元
    - id: op1_sel
      type: mux
      inputs: 3
      
    - id: mem_arb
      type: arbiter
      masters: 2

  conns:
    # 通过 interface 连接
    - from: fetch_inst
      to: mem_arb
      interface: axi4_if
      name: if_axi

    # 通过 sig 连接
    - from: decode_inst
      to: op1_sel
      sig: rs1_data
      width: 32
      type: data
```

### 3.5 连接定义（conns）

```yaml
conns:
  # 通过 interface 连接
  - id: mem_bus
    from: fetch_inst
    to: mem_ctrl
    interface: axi4_if
    name: if_req

  # 通过 sig 连接
  - id: bypass_ex_conn
    from: execute_inst
    to: op1_sel
    sig: bypass_ex
    width: 32
    type: bypass

  # 跨层级连接（使用路径表示法）
  - from: fetch_inst.pc_reg
    to: decode_inst
    sig: pc_plus4
```

**字段说明**:
- `id`: 可选，用于标注引用
- `from`, `to`: 必需，node id 或路径（如 `block.node`）
- `interface`: 引用预声明的 interface
- `sig`: 单信号名
- `name`: interface 实例名
- `width`: 位宽
- `type`: 信号类型

---

## 4. 标注层（可选）

### 4.1 流水线阶段标注（pipeline）

```yaml
pipeline:
  name: main
  stages:
    - name: IF
      label: "Instruction Fetch"
      nodes: [fetch_inst]
    - name: ID
      label: "Decode"
      nodes: [decode_inst]
    - name: EX
      label: "Execute"
      nodes: [op1_sel, execute_inst]

  registers:
    - between: [IF, ID]
      label: "IF/ID"
```

### 4.2 高亮标注（highlight）

| 类型 | targets 要求 | 用途 |
|------|-------------|------|
| **path** | conn id 列表 | 高亮信号路径 |
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
  - id: axi4_if
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
# 模块定义（可选）
# ═══════════════════════════════════════════════════

blocks:
  - id: regfile
    label: "Register File"
    nodes: []
    conns: []

# ═══════════════════════════════════════════════════
# 顶层实例化
# ═══════════════════════════════════════════════════

root:
  nodes:
    # ── IF Stage ──
    - id: pc_reg
      type: block
      block: pc_reg_block

    - id: imem_if
      type: interface
      interface: axi4_if

    # ── ID Stage ──
    - id: decode
      type: block
      block: decode_block

    - id: regfile
      type: block
      block: regfile

    # ── EX Stage ──
    - id: op1_sel
      type: mux
      inputs: 3

    - id: op2_sel
      type: mux
      inputs: 3

    - id: execute
      type: block
      block: execute_block

    # ── MEM Stage ──
    - id: memory
      type: block
      block: memory_block

    - id: mem_arb
      type: arbiter
      masters: 2

    - id: dmem_if
      type: interface
      interface: axi4_if

    # ── WB Stage ──
    - id: writeback
      type: block
      block: writeback_block

  conns:
    # ── IF → ID ──
    - from: pc_reg
      to: imem_if
      sig: pc
      width: 32

    - from: imem_if
      to: decode
      interface: axi4_if
      name: instr_fetch

    - from: decode
      to: regfile
      sig: rs_addr
      width: 10
      type: control

    # ── ID → EX ──
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

    # ── EX → MEM ──
    - from: execute
      to: memory
      sig: alu_result
      width: 32
      type: data

    - from: memory
      to: dmem_if
      interface: axi4_if
      name: data_access

    # ── MEM → WB ──
    - from: memory
      to: writeback
      sig: mem_data
      width: 32
      type: data

    # ── WB → ID ──
    - from: writeback
      to: regfile
      sig: rd_data
      width: 32
      type: data

    # ── 旁路网络 ──
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

    # ── 内存仲裁 ──
    - from: imem_if
      to: mem_arb
      interface: axi4_if
      name: if_req

    - from: dmem_if
      to: mem_arb
      interface: axi4_if
      name: lsu_req

# ═══════════════════════════════════════════════════
# 标注层
# ═══════════════════════════════════════════════════

pipeline:
  name: main
  stages:
    - name: IF
      label: "Instruction Fetch"
      nodes: [pc_reg, imem_if]
    - name: ID
      label: "Decode"
      nodes: [decode, regfile]
    - name: EX
      label: "Execute"
      nodes: [op1_sel, op2_sel, execute]
    - name: MEM
      label: "Memory"
      nodes: [memory, mem_arb, dmem_if]
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
- [x] YAML DSL 设计 v0.5
- [ ] YAML 解析器（js-yaml）
- [ ] 基础布局引擎（网格 + 流水线）
- [ ] 4种基础图元 + block 引用渲染

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
