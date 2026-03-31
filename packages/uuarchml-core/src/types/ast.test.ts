import { describe, it, expect } from 'vitest';
import type { UUArchMLGraph, Node, Connection } from './ast.js';

describe('UUArchMLGraph types', () => {
  it('should accept valid graph structure', () => {
    const graph: UUArchMLGraph = {
      name: 'test_cpu',
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
    expect(graph.name).toBe('test_cpu');
    expect(graph.blocks.cpu.nodes?.alu.type).toBe('inst');
  });

  it('should accept all node types', () => {
    const nodes: Node[] = [
      { type: 'inst' },
      { type: 'inst', block: 'alu_module' },
      { type: 'mux', inputs: 4 },
      { type: 'arbiter', masters: 2 },
      { type: 'fifo', depth: 8 },
      { type: 'reg' }
    ];
    expect(nodes).toHaveLength(6);
  });
});
