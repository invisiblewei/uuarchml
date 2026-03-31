# AGENTS.md - uuarchml

## 项目概述

**uuarchml** 是一个芯片微架构可视化工具，用于**模块设计早期**的架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

- **版本**: 0.6.1
- **技术栈**: TypeScript + pnpm monorepo + dagre.js + SVG 渲染
- **语言**: YAML 定义芯片架构（uuarchml）

## 核心概念

### 设计哲学
**结构优先，标注分层**
- **结构层**: blocks、interfaces、nodes、conns
- **标注层**: pipeline、highlight、notes

### 关键术语

| 术语 | 说明 |
|------|------|
| **interface** | 预声明的信号组，用于总线/协议 |
| **block** | 设计单元，分 top/module/func 三种 |
| **node** | block 内部的图元实例 (mux/arbiter/fifo/reg/inst) |
| **conns** | 连接定义 |
| **虚拟锚点** | 通过 `node:port` 语法创建的图示位置标记 |
| **replica** | 节点复制 (`replica: 4` 展开为 core[0..3]) |
| **bulk conn** | 批量连接语法 (`core[0..3]`, `core[*]`) |

## 项目结构

```
uuarchml/
├── docs/
│   ├── spec.md                # uuarchml 语言规范 v0.6.1
│   ├── DESIGN.md              # 设计文档
│   ├── STYLE_GUIDE.md         # 视觉规范
│   └── superpowers/plans/     # 实现计划文档
├── examples/
│   └── riscv_cpu.yaml         # RISC-V CPU 示例
├── packages/
│   ├── uuarchml-core/         # 核心库
│   │   ├── src/
│   │   │   ├── parser/        # YAML 解析
│   │   │   ├── validator/     # 结构验证
│   │   │   ├── preprocessor/  # replica/批量连接展开
│   │   │   ├── layout/        # dagre.js 布局
│   │   │   └── renderer/      # SVG 渲染
│   │   └── package.json
│   └── uuarchml-cli/          # CLI 工具
│       ├── bin/uuarchml.js
│       └── src/
├── package.json               # monorepo 根配置
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发（CLI 工具）
cd packages/uuarchml-cli
node bin/uuarchml.js examples/riscv_cpu.yaml -o output.svg

# 构建
pnpm build

# 测试
pnpm test

# 单个包测试
cd packages/uuarchml-core
pnpm vitest run
```

## uuarchml 快速参考

### 文件结构

```yaml
name: riscv_cpu

metadata:
  version: "1.0"
  description: "5-stage RISC-V CPU"

interfaces:
  axi4_if:
    label: "AXI4"
    signals: [...]

blocks:
  riscv_top:
    type: top
    nodes:
      core:
        type: inst
        replica: 4              # 展开为 core[0], core[1], ...
      arb:
        type: arbiter
        masters: 4
    conns:
      - from: core[*]          # 通配匹配所有 core
        to: arb
        sig: req
        map: one-to-one        # 一对一映射
      - from: core[0..3]       # 范围匹配
        to: bank[0..1]
        sig: data
        map: broadcast         # 广播映射（默认）

annotations:
  pipeline: {}
  highlight: []
  notes: []
```

### Block 类型

| 类型 | 说明 | 复用性 |
|------|------|--------|
| **top** | 根节点 | 不可复用 |
| **module** | 可复用模块 | 全局复用 |
| **func** | 内部功能块 | 局部使用 |

### Node 类型

| 类型 | 用途 | 参数 |
|------|------|------|
| **mux** | 多路选择器 | `inputs: 3` |
| **arbiter** | 仲裁器 | `masters: 2` |
| **fifo** | 队列 | `depth: 4` |
| **inst** | 实例化 block | `block: fetch`（可省略） |
| **reg** | 寄存器 | - |

### Replica 语法

| 语法 | 说明 | 展开结果 |
|------|------|----------|
| `replica: 4` | 复制 4 个实例 | `core[0]`, `core[1]`, `core[2]`, `core[3]` |
| `replica: 1` | 单个实例（仍展开） | `core[0]` |

### 批量连接语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `[0..3]` | 范围匹配 | `core[0..3]` 匹配 core[0] 到 core[3] |
| `[*]` | 通配匹配 | `core[*]` 匹配所有 core 实例 |

### Map 策略

| 策略 | 说明 |
|------|------|
| **broadcast** | 所有 from 连接到所有 to（默认） |
| **one-to-one** | 按索引一对一配对 |
| **all2all** | 全互联（同 broadcast） |

### 端口语法

| 语法 | 说明 |
|------|------|
| `node` | 简洁表达，不绘制端口锚点 |
| `node:port` | 创建虚拟锚点，区分连接位置 |
| `block.node` | 跨层级路径 |

## 架构流程

```
YAML 输入
   ↓
parser (js-yaml) → ParseResult
   ↓
validator → 结构验证
   ↓
preprocessor → 展开 replica 和批量连接
   ↓
layout (dagre.js) → 节点/边坐标
   ↓
renderer → SVG 输出
```

## 重要文档

- [spec.md](docs/spec.md) - uuarchml 语言规范 v0.6.1
- [STYLE_GUIDE.md](docs/STYLE_GUIDE.md) - 视觉规范
- [DESIGN.md](docs/DESIGN.md) - 架构设计

## 里程碑

### Phase 1: MVP ✅ 已完成
- [x] uuarchml 语言设计 v0.6.1
- [x] YAML 解析器（js-yaml）
- [x] 验证器（validator）
- [x] **Preprocessor**: replica 展开、批量连接展开
- [x] **布局引擎**: dagre.js 自动布局
- [x] **5种基础图元**: mux/arbiter/fifo/reg/inst 渲染
- [x] **CLI 工具**: 命令行接口
- [x] **测试**: 29 个单元/E2E 测试

### Phase 2: 完善
- [ ] 层级展开/折叠
- [ ] 信号路由（避免重叠）
- [ ] 关键路径高亮
- [ ] 主题切换

### Phase 3: 进阶
- [ ] 导出 PNG/SVG
- [ ] Mermaid 双向转换
- [ ] 动画演示

## 注意事项

1. **uuarchml 版本**: 当前使用 v0.6.1
2. **block 定义格式**: 使用 dict 格式（`block_id:`），不是 list
3. **interface 定义格式**: 使用 dict 格式（`interface_id:`），不是 list
4. **标注层**: 统一放在 `annotations` 键下
5. **preprocessor 顺序**: validate → preprocess → layout → render
6. **replica 展开**: 在 preprocessor 阶段完成，layout 只看到展开后的节点
