import type { Theme } from './themes.js';

export interface ShapeElement {
  tag: string;
  attrs: Record<string, string | number>;
  children?: ShapeElement[];
}

export function createInstShape(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  theme: Theme
): ShapeElement {
  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children: [
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
    ]
  };
}

export function createRegShape(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  theme: Theme
): ShapeElement {
  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children: [
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
    ]
  };
}

export function createMuxShape(
  x: number,
  y: number,
  width: number,
  height: number,
  inputs: number,
  direction: string,
  theme: Theme
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
  theme: Theme
): ShapeElement {
  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children: [
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
    ]
  };
}

export function createFifoShape(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  theme: Theme
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

  return {
    tag: 'g',
    attrs: { transform: `translate(${x}, ${y})` },
    children
  };
}

export function createEdgePath(
  points: Array<{ x: number; y: number }>,
  theme: Theme,
  type?: string
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

  return {
    tag: 'g',
    attrs: {},
    children: [
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
    ]
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
