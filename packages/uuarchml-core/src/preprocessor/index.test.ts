import { describe, it, expect } from 'vitest';
import { preprocess } from './index.js';
import type { Block } from '../types/ast.js';

describe('preprocess', () => {
  it('should expand replica and then bulk connections', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        core: { type: 'inst', replica: 2 },
        arb: { type: 'arbiter', masters: 2 }
      },
      conns: [
        { from: 'core[*]', to: 'arb', sig: 'req', map: 'one-to-one' }
      ]
    };

    const processed = preprocess(block);

    // Replica expanded
    expect(processed.nodes).toHaveProperty('core[0]');
    expect(processed.nodes).toHaveProperty('core[1]');
    expect(processed.nodes).not.toHaveProperty('core');

    // Bulk connection expanded
    expect(processed.conns).toHaveLength(2);
    expect(processed.conns?.[0]).toMatchObject({ from: 'core[0]', to: 'arb' });
    expect(processed.conns?.[1]).toMatchObject({ from: 'core[1]', to: 'arb' });
  });

  it('should handle riscv_cpu multi_core_cluster example', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        core: { type: 'inst', replica: 4 },
        l2_bank: { type: 'inst', replica: 2 }
      },
      conns: [
        { from: 'core[0..3]', to: 'l2_bank[0..1]', sig: 'req', map: 'one-to-one' }
      ]
    };

    const processed = preprocess(block);

    expect(Object.keys(processed.nodes || {})).toHaveLength(6); // 4 cores + 2 banks
    expect(processed.conns).toHaveLength(2); // min(4, 2) = 2 one-to-one pairs
  });
});
