import { describe, it, expect } from 'vitest';
import { parseYAML } from './index.js';

describe('parseYAML', () => {
  it('should parse simple graph', () => {
    const yaml = `
name: test_cpu
blocks:
  cpu:
    type: top
    nodes:
      alu:
        type: inst
      sel:
        type: mux
        inputs: 2
    conns:
      - from: sel
        to: alu
        sig: data
`;
    const result = parseYAML(yaml);
    expect(result.success).toBe(true);
    expect(result.graph?.name).toBe('test_cpu');
    expect(result.graph?.blocks.cpu.nodes?.alu.type).toBe('inst');
  });

  it('should report YAML syntax errors', () => {
    const yaml = 'invalid: yaml: :::';
    const result = parseYAML(yaml);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('should validate required fields', () => {
    const yaml = 'metadata: {}';
    const result = parseYAML(yaml);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].message).toContain('name');
  });
});
