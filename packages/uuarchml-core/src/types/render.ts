export interface RenderConfig {
  theme?: 'default' | 'dark' | 'paper';
  direction?: 'LR' | 'TB' | 'RL' | 'BT';
  showGrid?: boolean;
  compact?: boolean;
}

export interface Theme {
  background: string;
  grid: string;
  moduleFill: string;
  moduleStroke: string;
  text: string;
  textMuted: string;
  connection: string;
  connectionData: string;
  connectionControl: string;
  connectionBypass: string;
  portInput: string;
  portOutput: string;
  portControl: string;
}
