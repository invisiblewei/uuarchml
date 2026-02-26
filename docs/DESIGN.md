# ChipViz 设计文档 v0.4

**版本**: 0.4.0  
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

- **核心层**: 图元(nodes)和连接(conn)表达结构
- **标注层**: pipeline、highlight 等作为后加信息

### 2.2 图元类型（5种）

| 类型 | 用途 | 典型场景 |
|------|------|----------|
| **block** | 通用功能块 | ALU、Decode、Regfile |
| **mux** | 多路选择器 | 操作数选择、旁路选择 |
| **arbiter** | 仲裁器 | 内存仲裁、总线仲裁 |
| **fifo** | 队列 | 缓冲、异步时钟域隔离 |
| **interface** | 接口定义 | 预声明的一组信号 |

### 2.3 连接方式

连接包含三个信息：`from` → `to`，以及连接类型（`interface` 或 `sig`）。

```
通过接口连接:    [block A] ──[axi4]──▶ [block B]
                  (interface 预声明)

通过信号连接:    [block A] ──data──▶ [block B]
                  (sig 无需预声明)
```

**interface vs sig**:
- **interface**: 预声明的一组信号，用于标准总线、复杂协议
- **sig**: 单信号名，无需预声明，用于简单数据/控制通路

---

## 3. YAML DSL 规范 v0.4

### 3.1 核心结构

```yaml
# 必需：设计名称
chip: riscv_cpu

# 可选：元信息
metadata:
  version: "1.0"
  author: "designer"
  description: "5-stage RISC-V CPU"

# 必需：图元定义
nodes:
  # interface 需预声明
  - id: axi_if
    type: interface
    signals:
      - name: awaddr
        width: 32
      - name: wdata
        width: 32

# 必需：连接定义
conn:
  # 通过 interface 连接
  - from: fetch
    to: mem_ctrl
    interface: axi_if
  
  # 通过 sig 连接
  - from: execute
    to: op1_sel
    sig: bypass_ex
    width: 32
    type: bypass

# ─────────────────────────────────────
# 以下均为标注层，可选

# 可选：流水线阶段标注
pipeline: {}

# 可选：高亮标注
highlight: []

# 可选：文本注释
notes: []
```

### 3.2 图元定义（nodes）

#### block — 功能块

```yaml
- id: alu
  type: block
  label: "ALU"
```

#### mux — 多路选择器

```yaml
- id: op1_sel
  type: mux
  label: "OP1"
  inputs: 3
```

#### arbiter — 仲裁器

```yaml
- id: mem_arb
  type: arbiter
  label: "MemArb"
  masters: 2
```

#### fifo — 队列

```yaml
- id: fetch_buffer
  type: fifo
  label: "FB"
  depth: 4
```

#### interface — 接口定义

预声明的一组信号，用于复杂协议或总线。

```yaml
- id: axi4_if
  type: interface
  label: "AXI4"
  # 信号列表
  signals:
    - name: awaddr
      width: 32
      direction: out
    - name: awvalid
      width: 1
      direction: out
    - name: awready
      width: 1
      direction: in
    - name: wdata
      width: 32
      direction: out
    - name: wvalid
      width: 1
      direction: out
    - name: wready
      width: 1
      direction: in
```

### 3.3 连接定义（conn）

连接必须包含 `from` 和 `to`，以及 `interface` 或 `sig` 之一。

#### 通过 interface 连接

```yaml
conn:
  # 基本用法
  - from: fetch
    to: mem_ctrl
    interface: axi4_if
  
  # 带实例名（同一 interface 多次使用）
  - from: fetch
    to: mem_arb
    interface: axi4_if
    name: if_axi  # 实例名
  
  - from: lsu
    to: mem_arb
    interface: axi4_if
    name: lsu_axi
```

#### 通过 sig 连接

```yaml
conn:
  # 基础连接（无 id，无需标注引用）
  - from: decode
    to: regfile
    sig: rs_addr
    width: 10

  # 带 id 的连接（可被标注引用）
  - id: bypass_ex_conn
    from: execute
    to: op1_sel
    sig: bypass_ex
    width: 32
    type: bypass

  # 同一信号多目标（各带独立 id）
  - id: bypass_ex2_conn
    from: execute
    to: op2_sel
    sig: bypass_ex2
    width: 32
    type: bypass
```

**字段说明**:
- `id`: 可选，用于标注引用
- `from`, `to`: 必需，引用 node id
- `interface`: 引用预声明的 interface
- `sig`: 单信号名，无需预声明
- `name`: 实例名（仅用于 interface 连接）
- `width`: 位宽
- `type`: 信号类型，影响渲染样式

---

## 4. 标注层（可选）

### 4.1 流水线阶段标注（pipeline）

```yaml
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
```

### 4.2 高亮标注（highlight）

标注类型决定 targets 的合法性检查：

| 类型 | targets 要求 | 用途 |
|------|-------------|------|
| **path** | conn id 列表 | 高亮信号路径 |
| **range** | conn id 或 node id 列表 | 高亮区域/范围 |

```yaml
highlight:
  # path: 高亮信号路径（targets 必须是 conn id）
  - type: path
    name: critical_path
    targets: [bypass_ex_conn]
    color: red
    style: thick
    label: "EX→EX Bypass ~800ps"
    delay: "~200ps"

  # range: 高亮区域（targets 可以是 conn 或 node）
  - type: range
    name: bypass_network
    targets: [op1_sel, op2_sel, bypass_ex_conn, bypass_ex2_conn]
    color: blue
    opacity: 0.15
    label: "旁路网络"
```

### 4.3 文本注释（notes）

```yaml
notes:
  # 关联到节点
  - type: note
    target: mem_arb
    text: "Round-robin 仲裁\nIF 优先级更高"
    anchor: bottom

  # 关联到连接
  - type: note
    target: bypass_ex_conn
    text: "关键路径 ~800ps"
    anchor: top

  # 全局注释（无 target）
  - type: note
    pos: [100, 200]
    text: "注意：旁路网络增加 15% 面积"
```

---

## 5. 完整示例：RISC-V 五级流水线

```yaml
chip: riscv_cpu

metadata:
  version: "1.0"
  description: "经典 5 级流水线 RISC-V CPU"

# ═══════════════════════════════════════════════════
# 核心层：图元定义
# ═══════════════════════════════════════════════════

nodes:
  # ── interface 预声明 ──
  - id: axi4_if
    type: interface
    label: "AXI4"
    signals:
      - name: awaddr
        width: 32
      - name: wdata
        width: 32
      - name: araddr
        width: 32
      - name: rdata
        width: 32

  # ── IF Stage ──
  - id: pc_reg
    type: block
    label: "PC"

  - id: imem_if
    type: block
    label: "IMemIF"

  # ── ID Stage ──
  - id: decode
    type: block
    label: "Decode"

  - id: regfile
    type: block
    label: "Regfile"

  # ── EX Stage ──
  - id: op1_sel
    type: mux
    label: "OP1"
    inputs: 3

  - id: op2_sel
    type: mux
    label: "OP2"
    inputs: 3

  - id: execute
    type: block
    label: "ALU"

  # ── MEM Stage ──
  - id: memory
    type: block
    label: "DMEM"

  - id: mem_arb
    type: arbiter
    label: "MemArb"
    masters: 2

  - id: dmem_if
    type: block
    label: "DMemIF"

  # ── WB Stage ──
  - id: writeback
    type: block
    label: "WBU"

# ═══════════════════════════════════════════════════
# 核心层：连接定义
# ═══════════════════════════════════════════════════

conn:
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

  # ── WB → ID (写回) ──
  - from: writeback
    to: regfile
    sig: rd_data
    width: 32
    type: data

  # ── 旁路网络（带 id 供标注引用）──
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
  # path: 高亮关键路径
  - type: path
    name: critical_path
    targets: [bypass_ex_conn]
    color: red
    style: thick
    label: "EX→EX Bypass ~800ps"
    delay: "~200ps"

  # range: 高亮旁路网络区域
  - type: range
    name: bypass_network
    targets: [op1_sel, op2_sel, bypass_ex_conn, bypass_ex2_conn, bypass_mem_conn, bypass_mem2_conn]
    color: blue
    opacity: 0.15
    label: "3-to-1 旁路选择器"

notes:
  # 关联到节点
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
- [x] YAML DSL 设计 v0.4
- [ ] YAML 解析器（js-yaml）
- [ ] 基础布局引擎（网格 + 流水线）
- [ ] 5种图元渲染

### Phase 2: 完善
- [ ] 信号路由（避免重叠）
- [ ] 旁路通路特殊渲染
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
