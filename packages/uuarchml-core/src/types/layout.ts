export interface LayoutResult {
  width: number;
  height: number;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ports: Record<string, PortPosition>;
}

export interface PortPosition {
  x: number;
  y: number;
  side: 'n' | 's' | 'e' | 'w';
}

export interface LayoutEdge {
  id: string;
  from: { node: string; port?: string };
  to: { node: string; port?: string };
  points: Array<{ x: number; y: number }>;
  label?: string;
  type?: 'data' | 'control' | 'clock' | 'reset' | 'bypass';
}
