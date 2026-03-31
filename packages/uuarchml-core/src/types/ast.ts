export interface UUArchMLGraph {
  name: string;
  metadata?: Metadata;
  interfaces?: Record<string, InterfaceDef>;
  blocks: Record<string, Block>;
  annotations?: Annotations;
  layout?: LayoutConfig;
}

export interface Metadata {
  version?: string;
  description?: string;
  author?: string;
}

export interface InterfaceDef {
  label?: string;
  signals: SignalDef[];
}

export interface SignalDef {
  name: string;
  width?: number;
  direction: 'in' | 'out' | 'inout';
}

export type BlockType = 'top' | 'module' | 'func';

export interface Block {
  type: BlockType;
  label?: string;
  desc?: string;
  logic?: string;
  ports?: Record<string, PortDef>;
  nodes?: Record<string, Node>;
  conns?: Connection[];
}

export interface PortDef {
  dir: 'in' | 'out' | 'inout';
  interface?: string;
}

export type NodeType = 'inst' | 'reg' | 'mux' | 'arbiter' | 'fifo';

export interface Node {
  type: NodeType;
  block?: string;
  replica?: number;
  inputs?: number;
  masters?: number;
  depth?: number;
}

export interface Connection {
  id?: string;
  from: string;
  to: string;
  sig?: string;
  interface?: string;
  width?: number;
  map?: 'broadcast' | 'one-to-one' | 'all2all' | string;
  type?: 'data' | 'control' | 'clock' | 'reset' | 'bypass';
}

export interface Annotations {
  pipeline?: PipelineAnnotation;
  highlight?: HighlightAnnotation[];
  notes?: NoteAnnotation[];
}

export interface PipelineAnnotation {
  name: string;
  stages: PipelineStage[];
  registers?: PipelineRegister[];
  latency?: number;
}

export interface PipelineStage {
  name: string;
  label?: string;
  nodes: string[];
}

export interface PipelineRegister {
  between: [string, string];
  label?: string;
}

export interface HighlightAnnotation {
  type: 'path' | 'range';
  name: string;
  targets: string[];
  color?: string;
  style?: 'thick' | 'dashed';
  opacity?: number;
  label?: string;
  delay?: string;
}

export interface NoteAnnotation {
  target: string;
  text: string;
  anchor?: 'top' | 'bottom' | 'left' | 'right';
}

export interface LayoutConfig {
  direction?: 'LR' | 'TB' | 'RL' | 'BT';
  hints?: LayoutHint[];
}

export type LayoutHint =
  | { type: 'main_path'; nodes: string[]; priority?: 'high' | 'normal' | 'low' }
  | { type: 'rank'; level: 'same' | 'min' | 'max'; nodes: string[] }
  | { type: 'cluster'; name: string; nodes: string[]; style?: 'box' | 'round' | 'none' }
  | { type: 'port_override'; node: string; ports: Record<string, { side: 'n' | 's' | 'e' | 'w' }> };
