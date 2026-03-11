import yaml from 'js-yaml';
import type { UUArchMLGraph } from '../types/ast.js';
import { ParseErrorCollector, type ParseError } from './errors.js';

export interface ParseResult {
  success: boolean;
  graph?: UUArchMLGraph;
  errors?: ParseError[];
}

export function parseYAML(source: string): ParseResult {
  const errors = new ParseErrorCollector();

  // Step 1: Parse YAML
  let raw: unknown;
  try {
    raw = yaml.load(source);
  } catch (e) {
    if (e instanceof yaml.YAMLException) {
      errors.add(`YAML syntax error: ${e.message}`, 'error', e.mark?.line, e.mark?.column);
    } else {
      errors.add(`Parse error: ${e}`, 'error');
    }
    return { success: false, errors: errors.errors };
  }

  // Step 2: Validate structure
  const graph = validateStructure(raw, errors);

  return {
    success: !errors.hasErrors() && graph !== undefined,
    graph: graph || undefined,
    errors: errors.errors.length > 0 ? errors.errors : undefined
  };
}

function validateStructure(raw: unknown, errors: ParseErrorCollector): UUArchMLGraph | null {
  if (typeof raw !== 'object' || raw === null) {
    errors.add('Root must be an object');
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // Check required fields
  if (typeof obj.name !== 'string') {
    errors.add('Missing required field: name');
  }

  if (typeof obj.blocks !== 'object' || obj.blocks === null) {
    errors.add('Missing required field: blocks');
  }

  if (errors.hasErrors()) {
    return null;
  }

  // Basic validation passed, return as-is (more validation in validator module)
  return obj as UUArchMLGraph;
}
