import { describe, it, expect } from 'vitest';
import { expandBulkConnections } from './expand-bulk-conns.js';
import type { Connection, Block } from '../types/ast.js';

describe('expandBulkConnections', () => {
  it('should expand range notation [0..3]', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        'core[0]': { type: 'inst' },
        'core[1]': { type: 'inst' },
        'core[2]': { type: 'inst' },
        'core[3]': { type: 'inst' },
        'bus': { type: 'inst' }
      },
      conns: [
        { from: 'core[0..3]', to: 'bus', sig: 'req' }
      ]
    };

    const expanded = expandBulkConnections(block);

    expect(expanded.conns).toHaveLength(4);
    expect(expanded.conns?.[0].from).toBe('core[0]');
    expect(expanded.conns?.[1].from).toBe('core[1]');
    expect(expanded.conns?.[2].from).toBe('core[2]');
    expect(expanded.conns?.[3].from).toBe('core[3]');
  });

  it('should expand wildcard [*]', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        'core[0]': { type: 'inst' },
        'core[1]': { type: 'inst' },
        'arb': { type: 'arbiter', masters: 2 }
      },
      conns: [
        { from: 'core[*]', to: 'arb', sig: 'req', map: 'one-to-one' }
      ]
    };

    const expanded = expandBulkConnections(block);

    expect(expanded.conns).toHaveLength(2);
    expect(expanded.conns?.[0].from).toBe('core[0]');
    expect(expanded.conns?.[1].from).toBe('core[1]');
  });

  it('should handle one-to-one mapping', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        'src[0]': { type: 'inst' },
        'src[1]': { type: 'inst' },
        'dst[0]': { type: 'inst' },
        'dst[1]': { type: 'inst' }
      },
      conns: [
        { from: 'src[0..1]', to: 'dst[0..1]', sig: 'data', map: 'one-to-one' }
      ]
    };

    const expanded = expandBulkConnections(block);

    expect(expanded.conns).toHaveLength(2);
    expect(expanded.conns?.[0]).toMatchObject({ from: 'src[0]', to: 'dst[0]' });
    expect(expanded.conns?.[1]).toMatchObject({ from: 'src[1]', to: 'dst[1]' });
  });

  it('should keep regular connections unchanged', () => {
    const block: Block = {
      type: 'top',
      nodes: {
        alu: { type: 'inst' },
        reg: { type: 'reg' }
      },
      conns: [
        { from: 'alu', to: 'reg', sig: 'out' }
      ]
    };

    const expanded = expandBulkConnections(block);

    expect(expanded.conns).toHaveLength(1);
    expect(expanded.conns?.[0].from).toBe('alu');
  });
});
