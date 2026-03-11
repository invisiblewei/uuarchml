// Types
export * from './types/index.js';

// Parser
export { parseYAML, type ParseResult } from './parser/index.js';

// Validator
export { validate, type ValidationResult } from './validator/index.js';

// Layout
export { calculateLayout } from './layout/index.js';

// Renderer
export { renderToSVG } from './renderer/index.js';

// Preprocessor
export { preprocess } from './preprocessor/index.js';

// Convenience function
import { parseYAML } from './parser/index.js';
import { validate } from './validator/index.js';
import { preprocess } from './preprocessor/index.js';
import { calculateLayout } from './layout/index.js';
import { renderToSVG } from './renderer/index.js';
import type { RenderConfig } from './types/render.js';

export interface ProcessResult {
  success: boolean;
  svg?: string;
  errors: Array<{ message: string; path?: string }>;
}

export function processYAML(yaml: string, config?: RenderConfig): ProcessResult {
  const errors: Array<{ message: string; path?: string }> = [];

  // Parse
  const parseResult = parseYAML(yaml);
  if (!parseResult.success || !parseResult.graph) {
    return {
      success: false,
      errors: parseResult.errors?.map(e => ({
        message: e.message,
        path: `line ${e.line || '?'}`
      })) || [{ message: 'Unknown parse error' }]
    };
  }

  // Validate
  const validation = validate(parseResult.graph);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors
    };
  }

  // Preprocess: expand replica and bulk connections
  const graph = parseResult.graph;
  for (const [blockId, block] of Object.entries(graph.blocks)) {
    graph.blocks[blockId] = preprocess(block);
  }

  // Layout
  const layout = calculateLayout(graph);

  // Render
  const svg = renderToSVG(layout, config);

  return {
    success: true,
    svg,
    errors: []
  };
}
