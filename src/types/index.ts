/**
 * 芯片架构类型定义
 * 定义芯片设计中的核心概念：模块、端口、信号、数据通路等
 */

// ========== 基础类型 ==========

/** 信号位宽 */
export type BitWidth = number | 'auto';

/** 信号方向 */
export type SignalDirection = 'input' | 'output' | 'inout' | 'internal';

/** 信号类型 */
export type SignalType = 'wire' | 'reg' | 'logic' | 'bus' | 'clock' | 'reset';

// ========== 信号定义 ==========

/** 信号/端口定义 */
export interface Signal {
  name: string;
  direction: SignalDirection;
  width: BitWidth;
  type: SignalType;
  description?: string;
  /** 是否带有效信号 */
  valid?: string;
  /** 是否带就绪信号 */
  ready?: string;
}

// ========== 模块定义 ==========

/** 模块参数（类似 Verilog parameter） */
export interface ModuleParam {
  name: string;
  value: string | number;
  type?: 'int' | 'string' | 'bool';
}

/** 模块定义 */
export interface Module {
  id: string;
  name: string;
  description?: string;
  params?: ModuleParam[];
  inputs: Signal[];
  outputs: Signal[];
  internals?: Signal[];
  /** 子模块实例 */
  instances?: ModuleInstance[];
  /** 所属父模块 */
  parent?: string;
  /** 元数据 */
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
  };
}

/** 模块实例（模块的引用） */
export interface ModuleInstance {
  id: string;
  moduleId: string;
  instanceName: string;
  paramOverrides?: Record<string, string | number>;
  position?: Position;
}

// ========== 连接与数据通路 ==========

/** 位置信息（用于渲染） */
export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/** 连接点 */
export interface ConnectionPoint {
  moduleId: string;
  signalName: string;
  /** 连接点位置（相对于模块） */
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

/** 信号连接 */
export interface Connection {
  id: string;
  from: ConnectionPoint;
  to: ConnectionPoint;
  /** 总线宽度 */
  width?: BitWidth;
  /** 连接类型 */
  type?: 'data' | 'control' | 'clock' | 'reset' | 'handshake';
  /** 是否显示标签 */
  showLabel?: boolean;
}

/** 数据通路（高层次的连接描述） */
export interface DataPath {
  id: string;
  name?: string;
  stages: string[]; // 模块 ID 列表，表示数据流动顺序
  description?: string;
  /** 是否为流水线 */
  isPipeline?: boolean;
  /** 流水线深度 */
  pipelineDepth?: number;
}

// ========== 芯片顶层 ==========

/** 芯片设计 */
export interface ChipDesign {
  id: string;
  name: string;
  description?: string;
  version?: string;
  modules: Map<string, Module>;
  connections: Connection[];
  dataPaths: DataPath[];
  /** 顶层模块 ID */
  topModule?: string;
}

// ========== DSL 解析相关 ==========

/** DSL 语法节点类型 */
export type DSLNodeType = 
  | 'chip' 
  | 'module' 
  | 'signal' 
  | 'connection' 
  | 'datapath'
  | 'param';

/** DSL 语法节点 */
export interface DSLNode {
  type: DSLNodeType;
  name: string;
  children?: DSLNode[];
  attributes?: Record<string, unknown>;
  position?: { line: number; column: number };
}

/** 解析结果 */
export interface ParseResult {
  success: boolean;
  design?: ChipDesign;
  errors?: ParseError[];
}

/** 解析错误 */
export interface ParseError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

// ========== 渲染相关 ==========

/** 渲染配置 */
export interface RenderConfig {
  theme?: 'light' | 'dark' | 'paper';
  showGrid?: boolean;
  gridSize?: number;
  moduleWidth?: number;
  moduleHeight?: number;
  portSpacing?: number;
  fontSize?: number;
  /** 是否显示内部信号 */
  showInternalSignals?: boolean;
  /** 是否显示参数 */
  showParams?: boolean;
}

/** 渲染结果 */
export interface RenderResult {
  svg: string;
  width: number;
  height: number;
  elements: RenderedElement[];
}

/** 渲染后的元素（用于交互） */
export interface RenderedElement {
  id: string;
  type: 'module' | 'signal' | 'connection' | 'label';
  bbox: { x: number; y: number; width: number; height: number };
  data: unknown;
}
