# ChipViz 设计文档

**版本**: 0.1.0  
**日期**: 2026-02-26  
**状态**: 设计阶段

---

## 1. 项目目标

ChipViz 是一个芯片架构设计可视化工具，用于**模块设计早期**的微架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

### 1.1 核心定位

- **阶段**: 模块级设计早期（微架构定义阶段）
- **用户**: 芯片架构师、设计工程师
- **场景**: 设计评审、方案讨论、文档沉淀

### 1.2 明确不做

| 不做 | 原因 |
|------|------|
| 交互式编辑 | 静态图足够表达设计意图，降低复杂度 |
| RTL 代码生成 | 专注可视化，不替代实现 |
| 状态机表示 | 超出微架构层级，属于实现细节 |
| 精确时序分析 | 仅支持逻辑级数/数量的粗略估计 |

---

## 2. 三层可视化模型

### 2.1 第一层：组件结构

表达功能单元的层级关系。

**要素**:
- 图元节点（5种类型）
- 层级展开/折叠

**用途**: 理解设计划分、功能边界

### 2.2 第二层：关键信号通路

表达数据流和控制流的连接关系。

**要素**:
- 信号级连接（带位宽、类型）
- 通路类型标记（数据/控制/时钟/复位/旁路）

**用途**: 追踪关键信号、理解数据流动、识别瓶颈

### 2.3 第三层：信息标注

表达设计的关键决策和注意事项。

**要素**:
- **流水线信息**: 阶段划分、级数、延迟
- **高亮路径**: 关键路径、旁路网络
- **高亮区域**: 功能单元分组
- **文本标注**: 逻辑级数估计、面积预估

**用途**: 记录设计约束、标注优化方向

---

## 3. DSL 语法规范（YAML）

### 3.1 基础结构

```yaml
chip: <芯片名>

# 图元定义（5种类型）
nodes:
  - id: <唯一标识>
    type: block | mux | arbiter | fifo | port
    label: <显示名称>
    # type-specific 属性...
    
# 信号连接
signals:
  - from: <源节点>
    to: <目标节点>
    name: <信号名>
    width: <位宽>
    # ...
    
# 标注
annotations:
  pipeline: { ... }
  highlight: [ ... ]
  notes: [ ... ]
```

### 3.2 图元类型

#### block — 功能块

通用的功能代码块，不暗示物理实现。

```yaml
- id: alu
  type: block
  label: "ALU"
```

**渲染**: 圆角矩形 `[ALU]`

#### mux — 选择器

多路选择器，支持多输入单输出。

```yaml
- id: op1_sel
  type: mux
  label: "OP1"
  inputs: 3  # 输入路数
```

**渲染**: 梯形 `\[MUX]/`

#### arbiter — 仲裁器

多主设备仲裁，如内存仲裁器。

```yaml
- id: mem_arb
  type: arbiter
  label: "Mem Arb"
  masters: 2  # 主设备数
```

**渲染**: 菱形 `<ARB>`

#### fifo — 队列

FIFO 缓冲区。

```yaml
- id: fetch_buffer
  type: fifo
  label: "FB"
  depth: 4  # 深度
```

**渲染**: 圆柱 `[(FIFO)]`

#### port — 端口

模块的外部接口，如总线端口。

```yaml
- id: imem_port
  type: port
  label: "IMem"
  direction: slave  # slave | master
```

**渲染**: 矩形带边框 `|Port|`

### 3.3 信号连接

```yaml
signals:
  # 基础连接
  - from: fetch
    to: decode
    name: "instr"
    width: 32
    type: data  # data | control | clock | reset | bypass
    
  # 关键路径标记
  - from: execute
    to: op1_sel
    name: "bypass_ex"
    width: 32
    type: bypass
    critical: true  # 高亮关键路径
    
  # 总线连接
  - from: fetch
    to: mem_arb
    name: "if_req"
    type: req
    protocol: axi  # 可选协议标记
```

### 3.4 标注语法

#### 流水线标注

```yaml
annotations:
  pipeline:
    name: main
    stages:
      - {name: IF,  nodes: [fetch]}
      - {name: ID,  nodes: [decode, regfile]}
      - {name: EX,  nodes: [op1_sel, execute]}
      - {name: MEM, nodes: [memory]}
      - {name: WB,  nodes: [writeback]}
    latency: 5
```

#### 高亮路径

```yaml
annotations:
  highlight:
    - name: critical_path
      signal_path: [bypass_ex, operand1]  # 引用信号名
      color: red
      note: "旁路选择器关键路径 ~800ps"
```

#### 高亮区域

```yaml
annotations:
  highlight:
    - name: bypass_network
      region: [op1_sel, op2_sel, execute]
      color: blue
      opacity: 0.15
      note: "旁路网络覆盖"
```

#### 独立注释

```yaml
annotations:
  notes:
    - at: mem_arb
      text: "Round-robin 仲裁\nIF 优先级更高"
      anchor: bottom  # top | bottom | left | right
```

---

## 4. 完整示例

### 4.1 RISC-V 五级流水线 CPU

```yaml
chip: riscv_cpu

nodes:
  # 基础功能块
  - id: fetch
    type: block
    label: "IFU"
    
  - id: decode
    type: block
    label: "IDU"
    
  - id: regfile
    type: block
    label: "Regfile"
    
  - id: execute
    type: block
    label: "ALU"
    
  - id: memory
    type: block
    label: "LSU"
    
  - id: writeback
    type: block
    label: "WBU"

  # 选择器
  - id: op1_sel
    type: mux
    label: "OP1"
    inputs: 3
    
  - id: op2_sel
    type: mux
    label: "OP2"
    inputs: 3

  # 仲裁器
  - id: mem_arb
    type: arbiter
    label: "Mem Arb"
    masters: 2
    
  # 端口
  - id: imem_port
    type: port
    label: "IMem"
    direction: slave
    
  - id: dmem_port
    type: port
    label: "DMem"
    direction: slave

signals:
  # 指令流
  - from: fetch
    to: decode
    name: "instr"
    width: 32
    type: data
    
  # 操作数读取
  - from: decode
    to: regfile
    name: "rs_addr"
    width: 10
    type: data
    
  - from: regfile
    to: op1_sel
    name: "rs1_data"
    width: 32
    type: data
    
  - from: regfile
    to: op2_sel
    name: "rs2_data"
    width: 32
    type: data
    
  # 旁路（关键路径）
  - from: execute
    to: op1_sel
    name: "bypass_ex"
    width: 32
    type: bypass
    critical: true
    
  - from: memory
    to: op1_sel
    name: "bypass_mem"
    width: 32
    type: bypass
    
  - from: op1_sel
    to: execute
    name: "operand1"
    width: 32
    type: data
    
  - from: op2_sel
    to: execute
    name: "operand2"
    width: 32
    type: data
    
  # 写回
  - from: execute
    to: memory
    name: "alu_result"
    width: 32
    type: data
    
  - from: memory
    to: writeback
    name: "mem_data"
    width: 32
    type: data
    
  - from: writeback
    to: regfile
    name: "rd_data"
    width: 32
    type: data
    
  # 内存接口
  - from: fetch
    to: mem_arb
    name: "if_req"
    type: req
    
  - from: memory
    to: mem_arb
    name: "lsu_req"
    type: req
    
  - from: mem_arb
    to: imem_port
    name: "imem_bus"
    type: data
    protocol: axi
    
  - from: mem_arb
    to: dmem_port
    name: "dmem_bus"
    type: data
    protocol: axi

annotations:
  pipeline:
    name: main
    stages:
      - {name: IF,  nodes: [fetch]}
      - {name: ID,  nodes: [decode, regfile]}
      - {name: EX,  nodes: [op1_sel, op2_sel, execute]}
      - {name: MEM, nodes: [memory]}
      - {name: WB,  nodes: [writeback]}
    latency: 5
      
  highlight:
    - name: bypass_network
      nodes: [op1_sel, op2_sel]
      color: blue
      note: "3-to-1 旁路选择器"
      
    - name: critical_path
      signals: [bypass_ex, operand1]
      color: red
      note: "EX->EX 旁路关键路径 ~800ps"
      
    - name: mem_subsystem
      region: [mem_arb, imem_port, dmem_port]
      color: green
      opacity: 0.15
      note: "共享内存仲裁"
      
  notes:
    - at: mem_arb
      text: "Round-robin 仲裁\nIF 优先级更高"
      anchor: bottom
      
    - at: fetch
      text: "预估面积: 15K gates"
      anchor: left
```

### 4.2 生成 Mermaid

```mermaid
graph TD
    %% 图元定义
    fetch([IFU])
    decode([IDU])
    regfile([Regfile])
    op1_sel[\OP1/]
    op2_sel[\OP2/]
    execute([ALU])
    memory([LSU])
    writeback([WBU])
    mem_arb{Mem Arb}
    imem_port[|IMem|]
    dmem_port[|DMem|]
    
    %% 信号连接
    fetch -->|instr[32]| decode
    decode -->|rs_addr[10]| regfile
    regfile -->|rs1_data[32]| op1_sel
    regfile -->|rs2_data[32]| op2_sel
    execute -.->|bypass_ex[32]| op1_sel
    memory -.->|bypass_mem[32]| op1_sel
    op1_sel -->|operand1[32]| execute
    op2_sel -->|operand2[32]| execute
    execute -->|alu_result[32]| memory
    memory -->|mem_data[32]| writeback
    writeback -->|rd_data[32]| regfile
    fetch -->|if_req| mem_arb
    memory -->|lsu_req| mem_arb
    mem_arb -->|imem_bus| imem_port
    mem_arb -->|dmem_bus| dmem_port
    
    %% 样式
    style op1_sel fill:#e3f2fd
    style op2_sel fill:#e3f2fd
    linkStyle 4 stroke:red,stroke-width:3px
    linkStyle 6 stroke:red,stroke-width:3px
```

---

## 5. 渲染规范

### 5.1 图元样式

| 类型 | Mermaid 语法 | 样式 |
|------|-------------|------|
| block | `([label])` | 圆角矩形 |
| mux | `[\label/]` | 梯形 |
| arbiter | `{label}` | 菱形 |
| fifo | `[(label)]` | 圆柱 |
| port | `\|label\|` | 双边框矩形 |

### 5.2 信号样式

| 类型 | 线条 | 颜色 |
|------|------|------|
| data | 实线 | 蓝色 |
| control | 虚线 | 橙色 |
| clock | 细实线 | 紫色 |
| reset | 细实线 | 灰色 |
| bypass | 虚线 | 青色 |
| critical | 粗实线 | 红色 |

### 5.3 标注渲染

- **流水线**: 节点上方时间轴，阶段分段
- **高亮区域**: 半透明背景色覆盖
- **注释**: 虚线连接到目标节点

---

## 6. 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| DSL | YAML | 简洁、易读、工具生态好 |
| 解析 | js-yaml | YAML 解析器 |
| 生成 | Mermaid | 结构和连接可视化 |
| 标注 | 自定义 SVG | 叠加在 Mermaid 输出上 |
| 构建 | Vite | 开发服务器 + 打包 |

---

## 7. 里程碑

### Phase 1: MVP
- [x] YAML DSL 设计
- [ ] YAML 解析器
- [ ] Mermaid 生成器
- [ ] 基础 Web 界面

### Phase 2: 标注支持
- [ ] 流水线标注渲染
- [ ] 高亮路径/区域
- [ ] 注释系统

### Phase 3: 进阶功能
- [ ] 主题切换
- [ ] 导出 PNG/SVG
- [ ] CLI 工具

---

## 8. 参考

- **Mermaid**: https://mermaid.js.org/
- **Chipyard**: https://chipyard.readthedocs.io/
- **RISC-V Spec**: https://riscv.org/technical/specifications/

---

*本文档随项目迭代更新*
