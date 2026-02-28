# uuarchml 完整示例

## RISC-V 五级流水线 CPU

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
      pc_reg:
        type: inst
      imem_port:
        type: inst
        block: mem_port

      # ID Stage
      decode:
        type: inst
      regfile:
        type: inst

      # EX Stage
      op1_sel:
        type: mux
        inputs: 3
      op2_sel:
        type: mux
        inputs: 3
      execute:
        type: inst

      # MEM Stage
      memory:
        type: inst
      mem_arb:
        type: arbiter
        masters: 2
      dmem_port:
        type: inst
        block: mem_port

      # WB Stage
      writeback:
        type: inst

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
