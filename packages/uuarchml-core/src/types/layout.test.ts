import { describe, it, expect } from 'vitest';
import type { LayoutResult, LayoutNode, PortPosition } from './layout.js';

describe('Layout types', () => {
  it('should accept valid layout result', () => {
    const layout: LayoutResult = {
      width: 800,
      height: 600,
      nodes: [
        {
          id: 'alu',
          x: 100,
          y: 50,
          width: 120,
          height: 60,
          ports: {
            in0: { x: -60, y: 0, side: 'w' },
            out: { x: 60, y: 0, side: 'e' }
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          from: { node: 'sel', port: 'out' },
          to: { node: 'alu', port: 'in0' },
          points: [{ x: 0, y: 0 }, { x: 50, y: 50 }]
        }
      ]
    };
    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(1);
  });
});
