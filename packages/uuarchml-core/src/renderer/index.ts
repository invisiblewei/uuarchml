import type { LayoutResult, LayoutNode, LayoutEdge } from '../types/layout.js';
import type { RenderConfig } from '../types/render.js';
import { THEMES, type Theme } from './themes.js';
import {
  createInstShape, createRegShape, createMuxShape,
  createArbiterShape, createFifoShape, createEdgePath,
  type ShapeElement
} from './shapes.js';

export interface RenderOptions extends RenderConfig {
  /** 顶层 block 标签，用于渲染外层容器 */
  blockLabel?: string;
}

// 容器配置
const CONTAINER_PADDING = 20;
const CONTAINER_HEADER_HEIGHT = 28;

export function renderToSVG(
  layout: LayoutResult,
  config: RenderOptions = {}
): string {
  const theme = THEMES[config.theme || 'default'];
  const showGrid = config.showGrid ?? false;
  const blockLabel = config.blockLabel;
  const hasContainer = !!blockLabel;

  // 计算容器偏移
  const offsetX = hasContainer ? CONTAINER_PADDING : 0;
  const offsetY = hasContainer ? CONTAINER_PADDING + CONTAINER_HEADER_HEIGHT : 0;

  // 计算最终尺寸（包含容器）
  const finalWidth = hasContainer
    ? layout.width + CONTAINER_PADDING * 2
    : layout.width;
  const finalHeight = hasContainer
    ? layout.height + CONTAINER_PADDING * 2 + CONTAINER_HEADER_HEIGHT
    : layout.height;

  const elements: ShapeElement[] = [];

  // 如果有 blockLabel，添加外层容器
  if (hasContainer) {
    elements.push(createContainer(finalWidth, finalHeight, blockLabel, theme));
  }

  // Grid（在容器内部，需要偏移）
  if (showGrid) {
    elements.push(createGrid(finalWidth, finalHeight, theme, offsetX, offsetY));
  }

  // Edges（需要偏移）
  for (const edge of layout.edges) {
    const offsetPoints = edge.points.map(p => ({
      x: p.x + offsetX,
      y: p.y + offsetY
    }));
    elements.push(createEdgePath(offsetPoints, theme, edge.type, edge.label));
  }

  // Nodes（需要偏移）
  for (const node of layout.nodes) {
    const offsetNode: LayoutNode = {
      ...node,
      x: node.x + offsetX,
      y: node.y + offsetY
    };
    elements.push(createNodeShape(offsetNode, theme));
  }

  // Build SVG
  const svgContent = elements.map(renderElement).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${finalWidth}" height="${finalHeight}"
     viewBox="0 0 ${finalWidth} ${finalHeight}"
     style="background-color: ${theme.background}">
  ${svgContent}
</svg>`;
}

function createNodeShape(node: LayoutNode, theme: Theme): ShapeElement {
  const isMux = node.ports.sel !== undefined;
  const isReg = Object.keys(node.ports).some(p => p === 'en' || p === 'rst');
  const isArbiter = Object.keys(node.ports).some(p => p.startsWith('grant'));
  const isFifo = Object.keys(node.ports).some(p => p === 'enq');

  if (isMux) {
    const inputs = Object.keys(node.ports).filter(p => p.startsWith('in')).length;
    return createMuxShape(node.x, node.y, node.width, node.height, inputs, 'LR', theme, node.ports);
  } else if (isReg) {
    return createRegShape(node.x, node.y, node.width, node.height, node.id, theme, node.ports);
  } else if (isArbiter) {
    return createArbiterShape(node.x, node.y, node.width, node.height, theme, node.ports);
  } else if (isFifo) {
    return createFifoShape(node.x, node.y, node.width, node.height, 4, theme, node.ports);
  } else {
    return createInstShape(node.x, node.y, node.width, node.height, node.id, theme, node.ports);
  }
}

function createGrid(
  width: number,
  height: number,
  theme: Theme,
  offsetX = 0,
  offsetY = 0
): ShapeElement {
  const gridSize = 20;
  const children: ShapeElement[] = [];

  for (let x = offsetX; x <= width; x += gridSize) {
    children.push({
      tag: 'line',
      attrs: {
        x1: x, y1: offsetY, x2: x, y2: height,
        stroke: theme.grid,
        'stroke-width': 1
      }
    });
  }

  for (let y = offsetY; y <= height; y += gridSize) {
    children.push({
      tag: 'line',
      attrs: {
        x1: offsetX, y1: y, x2: width, y2: y,
        stroke: theme.grid,
        'stroke-width': 1
      }
    });
  }

  return { tag: 'g', attrs: { class: 'grid' }, children };
}

/** 创建外层容器（带标题栏） */
function createContainer(
  width: number,
  height: number,
  label: string,
  theme: Theme
): ShapeElement {
  const padding = 20;
  const headerHeight = 28;
  const containerWidth = width + padding * 2;
  const containerHeight = height + padding * 2 + headerHeight;

  // 调整所有内容的位置，给容器留出空间
  const children: ShapeElement[] = [
    // 容器外框
    {
      tag: 'rect',
      attrs: {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 2,
        rx: 4
      }
    },
    // 标题栏背景
    {
      tag: 'rect',
      attrs: {
        x: 0,
        y: 0,
        width: containerWidth,
        height: headerHeight,
        fill: theme.moduleHeader || '#e2e8f0',
        stroke: theme.moduleStroke,
        'stroke-width': 2,
        rx: 4
      }
    },
    // 标题栏底部线条（覆盖圆角）
    {
      tag: 'line',
      attrs: {
        x1: 0,
        y1: headerHeight,
        x2: containerWidth,
        y2: headerHeight,
        stroke: theme.moduleStroke,
        'stroke-width': 2
      }
    },
    // 标签文字
    {
      tag: 'text',
      attrs: {
        x: containerWidth / 2,
        y: headerHeight / 2 + 4,
        'text-anchor': 'middle',
        fill: theme.text,
        'font-size': 12,
        'font-weight': 'bold',
        'font-family': 'sans-serif'
      },
      children: [{ tag: 'textContent', attrs: {}, children: label } as any]
    }
  ];

  return {
    tag: 'g',
    attrs: {
      class: 'container',
      transform: `translate(0, 0)`
    },
    children
  };
}

function renderElement(el: ShapeElement): string {
  // Handle text content
  if (el.tag === 'textContent') {
    return String(el.children || '');
  }

  const attrs = Object.entries(el.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  if (!el.children || el.children.length === 0) {
    return `<${el.tag} ${attrs}/>`;
  }

  const children = el.children.map(renderElement).join('');
  return `<${el.tag} ${attrs}>${children}</${el.tag}>`;
}
