# uuarchml 设计文档 v0.6

**版本**: 0.6.0  
**日期**: 2026-02-26  
**状态**: 迭代中

---

## 1. 项目目标

**uuarchml** 是一个芯片微架构可视化工具，用于**模块设计早期**的架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

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

- **结构层**: blocks、interfaces、nodes、conns
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
| **node** | block 内部的图元实例 | mux、arbiter、fifo、reg、inst |

### 2.4 block 类型（3种）

| 类型 | 说明 | 复用性 |
|------|------|--------|
| **top** | 根节点，一个设计只有一个 | 不可复用 |
| **module** | 可复用模块，可被多处实例化 | 全局复用 |
| **func** | 内部功能块，仅在当前 block 内使用 | 局部使用 |

### 2.5 node 类型（5种）

| 类型 | 用途 | 参数 | 端口 |
|------|------|------|------|
| **mux** | 多路选择器 | `inputs: 3` | `in0`, `in1`, `in2`... `out`, `sel` |
| **arbiter** | 仲裁器 | `masters: 2` | `req0`, `req1`... `grant0`, `grant1` |
| **fifo** | 队列 | `depth: 4` | `enq`, `deq`, `full`, `empty` |
| **reg** | 寄存器 | - | `in`, `out`, `en`, `rst` |
| **inst** | 实例化 block | `block: fetch` | 由 block 定义决定 |

---

## 3. DSL 验证方案

验证 LLM 是否能正确理解并生成 uuarchml DSL。

### 3.1 验证等级

| 等级 | 描述 | 测试用例 |
|------|------|----------|
| **L1** | 基础结构 | 单 block，2-3 个 nodes，简单连接 |
| **L2** | 完整模块 | 多 block（top + modules），接口定义，分层连接 |
| **L3** | 复杂场景 | 旁路网络、内存仲裁、流水线标注、高亮路径 |
| **L4** | 端口连接 | 使用 `node:port` 语法精确连接 |

### 3.2 验证提示词模板

```
请根据以下描述生成 uuarchml DSL YAML：

[描述]
设计一个 3 级流水线 CPU，包含：
- IF 阶段：PC 寄存器、指令存储器接口
- EX 阶段：ALU、2 输入选择器
- 旁路：EX→EX 旁路

要求：
1. 使用 block 作为 key 的 dict 格式
2. nodes 使用 id 作为 key
3. inst 类型省略 block（如果与 id 一致）
4. 添加 pipeline 标注

[dsl.md 内容]
[此处插入 dsl.md 全文]
```

### 3.3 验证检查清单

**结构检查**：
- [ ] `chip` 字段存在
- [ ] `blocks` 是 dict，不是 list
- [ ] `nodes` 是 dict，不是 list
- [ ] `conns` 是 list

**类型检查**：
- [ ] block `type` 是 top/module/func 之一
- [ ] node `type` 是 mux/arbiter/fifo/reg/inst 之一
- [ ] `inst` 类型正确省略 block（当与 id 一致时）

**连接检查**：
- [ ] `from`/`to` 引用存在的 node
- [ ] 端口语法 `node:port` 正确使用
- [ ] 跨层级路径 `block.node` 正确使用

**标注检查**：
- [ ] `pipeline.stages.nodes` 引用存在的 nodes
- [ ] `highlight.targets` 引用存在的 conn/node

### 3.4 评分标准

| 指标 | 权重 | 说明 |
|------|------|------|
| 语法正确 | 30% | YAML 格式正确，无语法错误 |
| 结构正确 | 30% | 使用 dict 格式，id 作为 key |
| 语义正确 | 25% | 连接关系符合描述意图 |
| 标注完整 | 15% | pipeline/highlight 正确使用 |

**通过标准**：总分 ≥ 80%，且 L1-L3 全部通过

---

## 4. 文档索引

| 文档 | 内容 |
|------|------|
| [dsl.md](dsl.md) | YAML DSL 规范 v0.6 |
| [example.yaml](example.yaml) | RISC-V 五级流水线完整示例 |
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | 视觉规范 |

---

## 5. 输出格式

1. **SVG** — 矢量图，可缩放，可嵌入文档
2. **PNG** — 位图，方便分享
3. **Mermaid** — 文本格式，版本控制友好

---

## 6. 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| DSL | YAML | 简洁、易读、工具生态好 |
| 解析 | js-yaml | YAML 解析器 |
| 渲染 | 自定义 SVG | 精确控制流水线布局 |
| 构建 | Vite | 开发服务器 + 打包 |

---

## 7. 里程碑

见 [AGENTS.md](../AGENTS.md) 里程碑章节

---

## 8. 参考

- **参考图**: 经典计算机体系结构教材 RISC-V datapath 图
- **Mermaid**: https://mermaid.js.org/
- **RISC-V Spec**: https://riscv.org/technical/specifications/

---

*本文档随项目迭代更新*

---

## 3. DSL 验证方案

验证 LLM 是否能正确理解并生成 uuarchml DSL。

### 3.1 验证等级

| 等级 | 描述 | 测试用例 |
|------|------|----------|
| **L1** | 基础结构 | 单 block，2-3 个 nodes，简单连接 |
| **L2** | 完整模块 | 多 block（top + modules），接口定义，分层连接 |
| **L3** | 复杂场景 | 旁路网络、内存仲裁、流水线标注、高亮路径 |
| **L4** | 端口连接 | 使用 `node:port` 语法精确连接 |

### 3.2 验证提示词模板

```
请根据以下描述生成 uuarchml DSL YAML：

[描述]
设计一个 3 级流水线 CPU，包含：
- IF 阶段：PC 寄存器、指令存储器接口
- EX 阶段：ALU、2 输入选择器
- 旁路：EX→EX 旁路

要求：
1. 使用 block 作为 key 的 dict 格式
2. nodes 使用 id 作为 key
3. inst 类型省略 block（如果与 id 一致）
4. 添加 pipeline 标注

[dsl.md 内容]
[此处插入 dsl.md 全文]
```

### 3.3 验证检查清单

**结构检查**：
- [ ] `chip` 字段存在
- [ ] `blocks` 是 dict，不是 list
- [ ] `nodes` 是 dict，不是 list
- [ ] `conns` 是 list

**类型检查**：
- [ ] block `type` 是 top/module/func 之一
- [ ] node `type` 是 mux/arbiter/fifo/reg/inst 之一
- [ ] `inst` 类型正确省略 block（当与 id 一致时）

**连接检查**：
- [ ] `from`/`to` 引用存在的 node
- [ ] 端口语法 `node:port` 正确使用
- [ ] 跨层级路径 `block.node` 正确使用

**标注检查**：
- [ ] `pipeline.stages.nodes` 引用存在的 nodes
- [ ] `highlight.targets` 引用存在的 conn/node

### 3.4 评分标准

| 指标 | 权重 | 说明 |
|------|------|------|
| 语法正确 | 30% | YAML 格式正确，无语法错误 |
| 结构正确 | 30% | 使用 dict 格式，id 作为 key |
| 语义正确 | 25% | 连接关系符合描述意图 |
| 标注完整 | 15% | pipeline/highlight 正确使用 |

**通过标准**：总分 ≥ 80%，且 L1-L3 全部通过
