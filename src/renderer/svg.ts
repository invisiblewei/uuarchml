/**
 * SVG 渲染引擎
 * 将芯片设计渲染为可交互的 SVG 图形
 */

import type { 
  ChipDesign, Module, Signal, Connection, DataPath,
  RenderConfig, RenderResult, RenderedElement 
} from '@types/index';

/** 默认渲染配置 */
const DEFAULT_CONFIG: RenderConfig = {
  theme: 'light',
  showGrid: true,
  gridSize: 20,
  moduleWidth: 160,
  moduleHeight: 80,
  portSpacing: 24,
  fontSize: 12,
  showInternalSignals: false,
  showParams: false
};

/** 主题配色 */
const THEMES = {
  light: {
    background: '#ffffff',
    grid: '#e5e5e5',
    moduleFill: '#f8fafc',
    moduleStroke: '#334155',
    moduleHeader: '#e2e8f0',
    portInput: '#3b82f6',
    portOutput: '#10b981',
    portInout: '#f59e0b',
    text: '#1e293b',
    textMuted: '#64748b',
    connection: '#64748b',
    connectionData: '#3b82f6',
    connectionControl: '#f59e0b',
    connectionClock: '#8b5cf6'
  },
  dark: {
    background: '#0f172a',
    grid: '#1e293b',
    moduleFill: '#1e293b',
    moduleStroke: '#475569',
    moduleHeader: '#334155',
    portInput: '#60a5fa',
    portOutput: '#34d399',
    portInout: '#fbbf24',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    connection: '#94a3b8',
    connectionData: '#60a5fa',
    connectionControl: '#fbbf24',
    connectionClock: '#a78bfa'
  },
  paper: {
    background: '#fefce8',
    grid: '#fde68a',
    moduleFill: '#ffffff',
    moduleStroke: '#1f2937',
    moduleHeader: '#fef3c7',
    portInput: '#2563eb',
    portOutput: '#059669',
    portInout: '#d97706',
    text: '#1f2937',
    textMuted: '#6b7280',
    connection: '#6b7280',
    connectionData: '#2563eb',
    connectionControl: '#d97706',
    connectionClock: '#7c3aed'
  }
};

export class SVGRenderer {
  private config: RenderConfig;
  private theme: typeof THEMES.light;
  private elements: RenderedElement[] = [];
  private svgNS = 'http://www.w3.org/2000/svg';

  constructor(config: Partial<RenderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.theme = THEMES[this.config.theme || 'light'];
  }

  /** 渲染芯片设计 */
  render(design: ChipDesign): RenderResult {
    this.elements = [];
    
    // 计算布局
    const layout = this.calculateLayout(design);
    
    // 创建 SVG
    const svg = this.createSVGElement(layout.width, layout.height);
    
    // 添加背景
    if (this.config.showGrid) {
      svg.appendChild(this.createGrid(layout.width, layout.height));
    }
    
    // 渲染模块
    design.modules.forEach((module, id) => {
      const pos = layout.modulePositions.get(id);
      if (pos) {
        svg.appendChild(this.renderModule(module, pos.x, pos.y));
      }
    });
    
    // 渲染连接
    design.connections.forEach(conn => {
      svg.appendChild(this.renderConnection(conn, layout));
    });
    
    // 渲染数据通路标注
    design.dataPaths.forEach(dp => {
      svg.appendChild(this.renderDataPathLabel(dp, layout));
    });

    return {
      svg: svg.outerHTML,
      width: layout.width,
      height: layout.height,
      elements: this.elements
    };
  }

  /** 计算布局 */
  private calculateLayout(design: ChipDesign): {
    width: number;
    height: number;
    modulePositions: Map<string, { x: number; y: number }>;
  } {
    const modulePositions = new Map<string, { x: number; y: number }>();
    
    // 简单的网格布局
    const cols = Math.ceil(Math.sqrt(design.modules.size));
    const spacing = 40;
    const mWidth = this.config.moduleWidth || 160;
    const mHeight = this.config.moduleHeight || 80;
    
    let index = 0;
    design.modules.forEach((_, id) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      modulePositions.set(id, {
        x: 50 + col * (mWidth + spacing),
        y: 50 + row * (mHeight + spacing)
      });
      index++;
    });

    const maxRow = Math.ceil(design.modules.size / cols);
    return {
      width: 100 + cols * (mWidth + spacing),
      height: 100 + maxRow * (mHeight + spacing),
      modulePositions
    };
  }

  /** 创建 SVG 元素 */
  private createSVGElement(width: number, height: number): SVGSVGElement {
    const svg = document.createElementNS(this.svgNS, 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.backgroundColor = this.theme.background;
    return svg;
  }

  /** 创建网格背景 */
  private createGrid(width: number, height: number): SVGElement {
    const group = document.createElementNS(this.svgNS, 'g');
    group.setAttribute('class', 'grid');
    
    const gridSize = this.config.gridSize || 20;
    
    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      const line = document.createElementNS(this.svgNS, 'line');
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(height));
      line.setAttribute('stroke', this.theme.grid);
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }
    
    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
      const line = document.createElementNS(this.svgNS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', String(width));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', this.theme.grid);
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }
    
    return group;
  }

  /** 渲染模块 */
  private renderModule(module: Module, x: number, y: number): SVGElement {
    const group = document.createElementNS(this.svgNS, 'g');
    group.setAttribute('class', 'module');
    group.setAttribute('data-module-id', module.id);
    group.setAttribute('transform', `translate(${x}, ${y})`);
    
    const width = this.config.moduleWidth || 160;
    const height = this.config.moduleHeight || 80;
    const headerHeight = 24;
    
    // 模块主体
    const rect = document.createElementNS(this.svgNS, 'rect');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', this.theme.moduleFill);
    rect.setAttribute('stroke', this.theme.moduleStroke);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');
    group.appendChild(rect);
    
    // 标题栏
    const header = document.createElementNS(this.svgNS, 'rect');
    header.setAttribute('width', String(width));
    header.setAttribute('height', String(headerHeight));
    header.setAttribute('fill', this.theme.moduleHeader);
    header.setAttribute('stroke', this.theme.moduleStroke);
    header.setAttribute('stroke-width', '2');
    header.setAttribute('rx', '4');
    group.appendChild(header);
    
    // 标题栏底部线条（覆盖圆角）
    const headerBottom = document.createElementNS(this.svgNS, 'line');
    headerBottom.setAttribute('x1', '0');
    headerBottom.setAttribute('y1', String(headerHeight));
    headerBottom.setAttribute('x2', String(width));
    headerBottom.setAttribute('y2', String(headerHeight));
    headerBottom.setAttribute('stroke', this.theme.moduleStroke);
    headerBottom.setAttribute('stroke-width', '2');
    group.appendChild(headerBottom);
    
    // 模块名称
    const nameText = document.createElementNS(this.svgNS, 'text');
    nameText.setAttribute('x', String(width / 2));
    nameText.setAttribute('y', String(headerHeight / 2 + 4));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', this.theme.text);
    nameText.setAttribute('font-size', String(this.config.fontSize));
    nameText.setAttribute('font-weight', 'bold');
    nameText.textContent = module.name;
    group.appendChild(nameText);
    
    // 输入端口
    const portSpacing = this.config.portSpacing || 24;
    module.inputs.forEach((input, i) => {
      const portY = headerHeight + 12 + i * portSpacing;
      group.appendChild(this.renderPort(input, 0, portY, 'left'));
    });
    
    // 输出端口
    module.outputs.forEach((output, i) => {
      const portY = headerHeight + 12 + i * portSpacing;
      group.appendChild(this.renderPort(output, width, portY, 'right'));
    });
    
    // 记录元素位置
    this.elements.push({
      id: module.id,
      type: 'module',
      bbox: { x, y, width, height },
      data: module
    });
    
    return group;
  }

  /** 渲染端口 */
  private renderPort(signal: Signal, x: number, y: number, side: 'left' | 'right'): SVGElement {
    const group = document.createElementNS(this.svgNS, 'g');
    group.setAttribute('class', `port port-${signal.direction}`);
    group.setAttribute('data-signal', signal.name);
    
    const colors = {
      input: this.theme.portInput,
      output: this.theme.portOutput,
      inout: this.theme.portInout,
      internal: this.theme.textMuted
    };
    
    // 端口圆点
    const circle = document.createElementNS(this.svgNS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', colors[signal.direction]);
    group.appendChild(circle);
    
    // 端口标签
    const text = document.createElementNS(this.svgNS, 'text');
    const textX = side === 'left' ? x + 8 : x - 8;
    text.setAttribute('x', String(textX));
    text.setAttribute('y', String(y + 3));
    text.setAttribute('text-anchor', side === 'left' ? 'start' : 'end');
    text.setAttribute('fill', this.theme.textMuted);
    text.setAttribute('font-size', '10');
    text.textContent = signal.name;
    group.appendChild(text);
    
    return group;
  }

  /** 渲染连接 */
  private renderConnection(conn: Connection, layout: {
    modulePositions: Map<string, { x: number; y: number }>;
  }): SVGElement {
    const fromPos = layout.modulePositions.get(conn.from.moduleId);
    const toPos = layout.modulePositions.get(conn.to.moduleId);
    
    if (!fromPos || !toPos) {
      return document.createElementNS(this.svgNS, 'g');
    }
    
    const group = document.createElementNS(this.svgNS, 'g');
    group.setAttribute('class', 'connection');
    
    const mWidth = this.config.moduleWidth || 160;
    const mHeight = this.config.moduleHeight || 80;
    
    // 简化的连接：从源模块右边缘到目标模块左边缘
    const x1 = fromPos.x + mWidth;
    const y1 = fromPos.y + mHeight / 2;
    const x2 = toPos.x;
    const y2 = toPos.y + mHeight / 2;
    
    // 贝塞尔曲线
    const cp1x = x1 + (x2 - x1) / 2;
    const cp2x = x1 + (x2 - x1) / 2;
    
    const path = document.createElementNS(this.svgNS, 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`);
    path.setAttribute('stroke', this.theme.connection);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    group.appendChild(path);
    
    // 箭头
    const arrow = document.createElementNS(this.svgNS, 'polygon');
    arrow.setAttribute('points', `${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`);
    arrow.setAttribute('fill', this.theme.connection);
    group.appendChild(arrow);
    
    return group;
  }

  /** 渲染数据通路标签 */
  private renderDataPathLabel(dp: DataPath, layout: {
    modulePositions: Map<string, { x: number; y: number }>;
  }): SVGElement {
    const group = document.createElementNS(this.svgNS, 'g');
    group.setAttribute('class', 'datapath-label');
    
    if (dp.stages.length < 2) return group;
    
    const firstPos = layout.modulePositions.get(dp.stages[0]);
    const lastPos = layout.modulePositions.get(dp.stages[dp.stages.length - 1]);
    
    if (!firstPos || !lastPos) return group;
    
    const mWidth = this.config.moduleWidth || 160;
    const x = (firstPos.x + mWidth + lastPos.x) / 2;
    const y = firstPos.y - 20;
    
    const text = document.createElementNS(this.svgNS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', this.theme.textMuted);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-style', 'italic');
    text.textContent = dp.name || 'datapath';
    group.appendChild(text);
    
    return group;
  }
}

/** 便捷函数 */
export function renderToSVG(design: ChipDesign, config?: Partial<RenderConfig>): RenderResult {
  const renderer = new SVGRenderer(config);
  return renderer.render(design);
}
