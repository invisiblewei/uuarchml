import type { Theme } from './themes.js';
import type { PortPosition } from '../types/layout.js';

export interface ShapeElement {
  tag: string;
  attrs: Record<string, string | number>;
  children?: ShapeElement[];
}

/** 创建端口圆点和标签 */
function createPortElement(
  portName: string,
  x: number,
  y: number,
  side: 'n' | 's' | 'e' | 'w',
  theme: Theme
): ShapeElement {
  const isInput = side === 'w' || side === 'n';
  const labelOffset = 8;

  // 根据方向计算标签位置
  let labelX = x;
  let labelY = y;
  let textAnchor: string;

  switch (side) {
    case 'w': // 左侧输入
      labelX = x + labelOffset;
      labelY = y + 3;
      textAnchor = 'start';
      break;
    case 'e': // 右侧输出
      labelX = x - labelOffset;
      labelY = y + 3;
      textAnchor = 'end';
      break;
    case 'n': // 顶部
      labelX = x;
      labelY = y - labelOffset + 3;
      textAnchor = 'middle';
      break;
    case 's': // 底部
      labelX = x;
      labelY = y + labelOffset + 3;
      textAnchor = 'middle';
      break;
  }

  return {
    tag: 'g',
    attrs: { class: 'port' },
    children: [
      // 端口圆点
      {
        tag: 'circle',
        attrs: {
          cx: x,
          cy: y,
          r: 3,
          fill: isInput ? theme.portInput : theme.portOutput,
          stroke: 'none'
        }
      },
      // 端口标签
      {
        tag: 'text',
        attrs: {
          x: labelX,
          y: labelY,
          'text-anchor': textAnchor,
          fill: theme.textMuted,
          'font-size': 9,
          'font-family': 'sans-serif'
        },
        children: [{ tag: 'textContent', attrs: {}, children: portName } as any]
      }
    ]
  };
}

/** 渲染节点的所有端口 */
function renderPorts(
  ports: Record<string, PortPosition>,
  theme: Theme
): ShapeElement[] {
  const elements: ShapeElement[] = [];
  for (const [name, pos] of Object.entries(ports)) {
    elements.push(createPortElement(name, pos.x, pos.y, pos.side, theme));
  }
  return elements;
}

export function createInstShape(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  theme: Theme,
  ports: Record<string, PortPosition> = {}
): ShapeElement {
  const children: ShapeElement[] = [
    {
      tag: 'rect',
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 2
      }
    },
    {
      tag: 'text',
      attrs: {
        x: 0,
        y: 4,
        'text-anchor': 'middle',
        fill: theme.text,
        'font-size': 14,
        'font-family': 'sans-serif'
      },
      children: [{ tag: 'textContent', attrs: {}, children: label } as any]
    }
  ];

  // 添加端口
  children.push(...renderPorts(ports, theme));

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createRegShape(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  theme: Theme,
  ports: Record<string, PortPosition> = {}
): ShapeElement {
  const children: ShapeElement[] = [
    {
      tag: 'rect',
      attrs: {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 2
      }
    },
    {
      tag: 'text',
      attrs: {
        x: -width / 2 + 8,
        y: 0,
        fill: theme.textMuted,
        'font-size': 12
      },
      children: [{ tag: 'textContent', attrs: {}, children: '>' } as any]
    },
    {
      tag: 'text',
      attrs: {
        x: 0,
        y: 4,
        'text-anchor': 'middle',
        fill: theme.text,
        'font-size': 12
      },
      children: [{ tag: 'textContent', attrs: {}, children: label } as any]
    }
  ];

  // 添加端口
  children.push(...renderPorts(ports, theme));

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createMuxShape(
  x: number,
  y: number,
  width: number,
  height: number,
  inputs: number,
  direction: string,
  theme: Theme,
  ports: Record<string, PortPosition> = {}
): ShapeElement {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const offset = 10;

  let points: string;
  if (direction === 'LR') {
    points = `${-halfWidth + offset},${-halfHeight} ${halfWidth},${-halfHeight + 10} ${halfWidth},${halfHeight - 10} ${-halfWidth + offset},${halfHeight}`;
  } else if (direction === 'TB') {
    points = `${-halfWidth},${-halfHeight + offset} ${halfWidth},${-halfHeight + offset} ${halfWidth - 10},${halfHeight} ${-halfWidth + 10},${halfHeight}`;
  } else {
    points = `${-halfWidth + offset},${-halfHeight} ${halfWidth},${-halfHeight + 10} ${halfWidth},${halfHeight - 10} ${-halfWidth + offset},${halfHeight}`;
  }

  const children: ShapeElement[] = [
    {
      tag: 'polygon',
      attrs: {
        points,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 2
      }
    }
  ];

  for (let i = 0; i < inputs; i++) {
    const yOffset = -halfHeight + 15 + i * ((height - 30) / Math.max(1, inputs - 1));
    children.push({
      tag: 'text',
      attrs: {
        x: -halfWidth + 20,
        y: yOffset,
        fill: theme.textMuted,
        'font-size': 10
      },
      children: [{ tag: 'textContent', attrs: {}, children: String(i) } as any]
    });
  }

  // 添加端口
  children.push(...renderPorts(ports, theme));

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createArbiterShape(
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme,
  ports: Record<string, PortPosition> = {}
): ShapeElement {
  const children: ShapeElement[] = [
    {
      tag: 'circle',
      attrs: {
        cx: 0,
        cy: 0,
        r: Math.min(width, height) / 2 - 5,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 2
      }
    },
    {
      tag: 'text',
      attrs: {
        x: 0,
        y: 4,
        'text-anchor': 'middle',
        fill: theme.text,
        'font-size': 10
      },
      children: [{ tag: 'textContent', attrs: {}, children: 'ARB' } as any]
    }
  ];

  // 添加端口
  children.push(...renderPorts(ports, theme));

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createFifoShape(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  theme: Theme,
  ports: Record<string, PortPosition> = {}
): ShapeElement {
  const slots = Math.min(4, depth || 4);
  const slotWidth = (width - 20) / slots;
  const children: ShapeElement[] = [];

  for (let i = 0; i < slots; i++) {
    children.push({
      tag: 'rect',
      attrs: {
        x: -width / 2 + 10 + i * slotWidth,
        y: -height / 2 + 5,
        width: slotWidth - 2,
        height: height - 10,
        fill: theme.moduleFill,
        stroke: theme.moduleStroke,
        'stroke-width': 1
      }
    });
  }

  // 添加端口
  children.push(...renderPorts(ports, theme));

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createEdgePath(
  points: Array<{ x: number; y: number }>,
  theme: Theme,
  type?: string,
  label?: string
): ShapeElement {
  if (points.length < 2) {
    return { tag: 'g', attrs: {} };
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }

  let stroke = theme.connection;
  let strokeWidth = 1.5;
  let strokeDasharray: string | undefined;

  if (type === 'data') stroke = theme.connectionData;
  else if (type === 'control') stroke = theme.connectionControl;
  else if (type === 'bypass') {
    stroke = theme.connectionBypass;
    strokeDasharray = '5,5';
  }

  const children: ShapeElement[] = [
    {
      tag: 'path',
      attrs: {
        d,
        fill: 'none',
        stroke,
        'stroke-width': strokeWidth,
        ...(strokeDasharray && { 'stroke-dasharray': strokeDasharray })
      }
    },
    createArrowHead(points[points.length - 1], points[points.length - 2], stroke)
  ];

  // 添加信号标签在连线中点
  if (label) {
    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];

    children.push({
      tag: 'g',
      attrs: {},
      children: [
        // 标签背景
        {
          tag: 'rect',
          attrs: {
            x: midPoint.x - 20,
            y: midPoint.y - 10,
            width: 40,
            height: 16,
            fill: theme.background,
            stroke: 'none',
            rx: 2
          }
        },
        // 标签文字
        {
          tag: 'text',
          attrs: {
            x: midPoint.x,
            y: midPoint.y + 3,
            'text-anchor': 'middle',
            fill: theme.text,
            'font-size': 9,
            'font-family': 'sans-serif'
          },
          children: [{ tag: 'textContent', attrs: {}, children: label } as any]
        }
      ]
    });
  }

  return {
    tag: 'g',
    attrs: {},
    children
  };
}

function createArrowHead(
  tip: { x: number; y: number },
  prev: { x: number; y: number },
  color: string
): ShapeElement {
  const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const size = 8;

  const x1 = tip.x - size * Math.cos(angle - Math.PI / 6);
  const y1 = tip.y - size * Math.sin(angle - Math.PI / 6);
  const x2 = tip.x - size * Math.cos(angle + Math.PI / 6);
  const y2 = tip.y - size * Math.sin(angle + Math.PI / 6);

  return {
    tag: 'polygon',
    attrs: {
      points: `${tip.x},${tip.y} ${x1},${y1} ${x2},${y2}`,
      fill: color
    }
  };
}
