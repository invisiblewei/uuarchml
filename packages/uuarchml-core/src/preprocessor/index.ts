import type { Block } from '../types/ast.js';
import { expandReplica } from './expand-replica.js';
import { expandBulkConnections } from './expand-bulk-conns.js';

/**
 * Preprocess a block to expand replica nodes and bulk connections.
 * This must run AFTER validation but BEFORE layout.
 */
export function preprocess(block: Block): Block {
  // Step 1: Expand replica nodes
  const withReplicas = expandReplica(block);

  // Step 2: Expand bulk connections
  const withConnections = expandBulkConnections(withReplicas);

  return withConnections;
}
