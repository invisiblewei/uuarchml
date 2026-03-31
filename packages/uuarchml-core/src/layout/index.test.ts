import { describe, it, expect } from 'vitest';
import { calculateLayout } from './index.js';
import type { UUArchMLGraph } from '../types/ast.js';

describe('calculateLayout', () => {
  it('should layout simple graph', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            alu: { type: 'inst' },
            sel: { type: 'mux', inputs: 2 }
          },
          conns: [
            { from: 'sel', to: 'alu', sig: 'data' }
          ]
        }
      }
    };

    const layout = calculateLayout(graph);

    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.nodes).toHaveLength(2);

    const alu = layout.nodes.find(n => n.id === 'alu');
    const sel = layout.nodes.find(n => n.id === 'sel');
    expect(alu).toBeDefined();
    expect(sel).toBeDefined();
    expect(alu!.x).not.toBe(0);
    expect(alu!.y).not.toBe(0);
  });

  it('should respect LR direction', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      layout: { direction: 'LR' },
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            a: { type: 'inst' },
            b: { type: 'inst' }
          },
          conns: [{ from: 'a', to: 'b', sig: 'x' }]
        }
      }
    };

    const layout = calculateLayout(graph);
    const a = layout.nodes.find(n => n.id === 'a');
    const b = layout.nodes.find(n => n.id === 'b');

    expect(a!.x).toBeLessThan(b!.x);
  });

  it('should generate ports for mux', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            sel: { type: 'mux', inputs: 2 }
          }
        }
      }
    };

    const layout = calculateLayout(graph);
    const sel = layout.nodes.find(n => n.id === 'sel');

    expect(sel!.ports.in0).toBeDefined();
    expect(sel!.ports.in1).toBeDefined();
    expect(sel!.ports.out).toBeDefined();
    expect(sel!.ports.sel).toBeDefined();
  });
});
