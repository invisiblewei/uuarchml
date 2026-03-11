import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { processYAML } from 'uuarchml-core';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const EXAMPLES_DIR = resolve(__dirname, '../../../examples');

describe('E2E: processYAML', () => {
  it('should process simple_test.yaml', () => {
    const yaml = readFileSync(resolve(EXAMPLES_DIR, 'test_simple.yaml'), 'utf-8');
    const result = processYAML(yaml);

    expect(result.success).toBe(true);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    expect(result.errors).toHaveLength(0);
  });

  it('should process example with all node types', () => {
    const yaml = `
name: all_types_test
blocks:
  test:
    type: top
    nodes:
      alu: { type: inst }
      reg1: { type: reg }
      mux1: { type: mux, inputs: 3 }
      arb: { type: arbiter, masters: 2 }
      fifo1: { type: fifo, depth: 8 }
    conns:
      - from: mux1
        to: reg1
        sig: data
      - from: reg1
        to: alu
        sig: out
`;
    const result = processYAML(yaml);

    expect(result.success).toBe(true);
    expect(result.svg).toContain('<svg');
    // Check that different node shapes are rendered (mux=polygon, arb=circle)
    expect(result.svg).toContain('polygon');  // mux is a polygon
    expect(result.svg).toContain('ARB');      // arbiter label
  });
});
