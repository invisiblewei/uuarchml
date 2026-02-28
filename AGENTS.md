# AGENTS.md - uuarchml

## 项目概述

**uuarchml** 是一个芯片微架构可视化工具，用于**模块设计早期**的架构对齐。在 RTL 代码撰写前，帮助 AI 和人快速理解并达成共识。

- **版本**: 0.6.0
- **技术栈**: TypeScript + Vite + SVG 渲染
- **DSL**: YAML 定义芯片架构

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

## 项目结构

```
uuarchml/
├── docs/
│   ├── DESIGN.md          # YAML DSL 规范 v0.6
│   └── STYLE_GUIDE.md     # 视觉规范
├── examples/
│   └── riscv-style-demo.html
├── src/
│   ├── ai/
│   │   └── assistant.ts   # AI 助手功能
│   ├── index.ts           # 主入口
│   └── main.ts            # Web 应用入口
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 开发命令

```bash
# 开发服务器
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 测试
npm run test

# 代码检查
npm run lint
```

## YAML DSL 快速参考

### 文件结构

```yaml
chip: riscv_cpu

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
    nodes: [...]
    conns: [...]

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
| **inst** | 实例化 block | `block: fetch`（与 node id 一致时可省略） |
| **reg** | 寄存器 | - |

## 重要文档

- [DESIGN.md](docs/DESIGN.md) - YAML DSL 规范 v0.6
- [STYLE_GUIDE.md](docs/STYLE_GUIDE.md) - 视觉规范

## 里程碑

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

## 注意事项

1. **DSL 版本**: 当前使用 v0.6，注意与旧版本不兼容的变更
2. **block 定义格式**: 使用 dict 格式（`block_id:`），不是 list
3. **interface 定义格式**: 使用 dict 格式（`interface_id:`），不是 list
4. **标注层**: 统一放在 `annotations` 键下
