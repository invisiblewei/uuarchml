import { describe, it, expect } from 'vitest';
import { validate } from './index.js';
import type { UUArchMLGraph } from '../types/ast.js';

describe('validate', () => {
  it('should pass valid graph', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            alu: { type: 'inst' }
          }
        }
      }
    };
    const result = validate(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid block reference', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            alu: { type: 'inst', block: 'nonexistent' }
          }
        }
      }
    };
    const result = validate(graph);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('nonexistent');
  });

  it('should detect invalid node reference in connection', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            alu: { type: 'inst' }
          },
          conns: [
            { from: 'nonexistent', to: 'alu', sig: 'data' }
          ]
        }
      }
    };
    const result = validate(graph);
    expect(result.valid).toBe(false);
  });

  it('should detect invalid node type', () => {
    const graph: UUArchMLGraph = {
      name: 'test',
      blocks: {
        cpu: {
          type: 'top',
          nodes: {
            bad: { type: 'invalid' as any }
          }
        }
      }
    };
    const result = validate(graph);
    expect(result.valid).toBe(false);
  });
});
