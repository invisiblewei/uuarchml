import { describe, it, expect } from 'vitest';
import { expandReplica } from './expand-replica.js';
import type { Block } from '../types/ast.js';

describe('expandReplica', () => {
  it('should expand single replica node', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        core: { type: 'inst', replica: 4 }
      }
    };

    const expanded = expandReplica(block);

    expect(expanded.nodes).toHaveProperty('core[0]');
    expect(expanded.nodes).toHaveProperty('core[1]');
    expect(expanded.nodes).toHaveProperty('core[2]');
    expect(expanded.nodes).toHaveProperty('core[3]');
    expect(expanded.nodes).not.toHaveProperty('core');
    expect(expanded.nodes?.['core[0]'].replica).toBeUndefined();
  });

  it('should keep non-replica nodes unchanged', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        alu: { type: 'inst' },
        reg: { type: 'reg' }
      }
    };

    const expanded = expandReplica(block);

    expect(expanded.nodes).toHaveProperty('alu');
    expect(expanded.nodes).toHaveProperty('reg');
  });

  it('should handle replica=1 as single instance', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        single: { type: 'inst', replica: 1 }
      }
    };

    const expanded = expandReplica(block);

    expect(expanded.nodes).toHaveProperty('single[0]');
  });
});
