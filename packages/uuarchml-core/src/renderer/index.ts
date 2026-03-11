import type { LayoutResult, LayoutNode, LayoutEdge } from '../types/layout.js';
import type { RenderConfig } from '../types/render.js';
import { THEMES, type Theme } from './themes.js';
import {
  createInstShape, createRegShape, createMuxShape,
  createArbiterShape, createFifoShape, createEdgePath,
  type ShapeElement
} from './shapes.js';

export function renderToSVG(
  layout: LayoutResult,
  config: RenderConfig = {}
): string {
  const theme = THEMES[config.theme || 'default'];
  const showGrid = config.showGrid ?? false;

  const elements: ShapeElement[] = [];

  // Grid
  if (showGrid) {
    elements.push(createGrid(layout.width, layout.height, theme));
  }

  // Edges
  for (const edge of layout.edges) {
    elements.push(createEdgePath(edge.points, theme));
  }

  // Nodes
  for (const node of layout.nodes) {
    elements.push(createNodeShape(node, theme));
  }

  // Build SVG
  const svgContent = elements.map(renderElement).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${layout.width}" height="${layout.height}"
     viewBox="0 0 ${layout.width} ${layout.height}"
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
    return createMuxShape(node.x, node.y, node.width, node.height, inputs, 'LR', theme);
  } else if (isReg) {
    return createRegShape(node.x, node.y, node.width, node.height, node.id, theme);
  } else if (isArbiter) {
    return createArbiterShape(node.x, node.y, node.width, node.height, theme);
  } else if (isFifo) {
    return createFifoShape(node.x, node.y, node.width, node.height, 4, theme);
  } else {
    return createInstShape(node.x, node.y, node.width, node.height, node.id, theme);
  }
}

function createGrid(width: number, height: number, theme: Theme): ShapeElement {
  const gridSize = 20;
  const children: ShapeElement[] = [];

  for (let x = 0; x <= width; x += gridSize) {
    children.push({
      tag: 'line',
      attrs: {
        x1: x, y1: 0, x2: x, y2: height,
        stroke: theme.grid,
        'stroke-width': 1
      }
    });
  }

  for (let y = 0; y <= height; y += gridSize) {
    children.push({
      tag: 'line',
      attrs: {
        x1: 0, y1: y, x2: width, y2: y,
        stroke: theme.grid,
        'stroke-width': 1
      }
    });
  }

  return { tag: 'g', attrs: { class: 'grid' }, children };
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
