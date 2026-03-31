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
import { renderToSVG, type RenderOptions } from './renderer/index.js';
import type { RenderConfig } from './types/render.js';
import type { Block } from './types/ast.js';

export interface ProcessResult {
  success: boolean;
  svg?: string;
  errors: Array<{ message: string; path?: string }>;
}

function findTopBlock(graph: { blocks: Record<string, Block> }): { id: string; block: Block } | null {
  for (const [id, block] of Object.entries(graph.blocks)) {
    if (block.type === 'top') {
      return { id, block };
    }
  }
  // 如果没有 top，返回第一个 block
  const first = Object.entries(graph.blocks)[0];
  if (first) {
    return { id: first[0], block: first[1] };
  }
  return null;
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

  // Find top block for container label
  const topBlock = findTopBlock(graph);
  const blockLabel = topBlock?.block.label || topBlock?.id;

  // Layout
  const layout = calculateLayout(graph);

  // Render with container
  const renderOptions: RenderOptions = {
    ...config,
    blockLabel
  };
  const svg = renderToSVG(layout, renderOptions);

  return {
    success: true,
    svg,
    errors: []
  };
}
