import type { UUArchMLGraph, Block, Node, Connection, NodeType } from '../types/ast.js';

export interface ValidationError {
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_NODE_TYPES: NodeType[] = ['inst', 'reg', 'mux', 'arbiter', 'fifo'];

export function validate(graph: UUArchMLGraph): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate blocks
  for (const [blockId, block] of Object.entries(graph.blocks)) {
    validateBlock(blockId, block, graph.blocks, errors);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateBlock(
  blockId: string,
  block: Block,
  allBlocks: Record<string, Block>,
  errors: ValidationError[]
): void {
  // Validate block type
  const validBlockTypes = ['top', 'module', 'func'];
  if (!validBlockTypes.includes(block.type)) {
    errors.push({
      message: `Invalid block type "${block.type}" in block "${blockId}"`,
      path: `blocks.${blockId}.type`
    });
  }

  // Validate nodes
  if (block.nodes) {
    for (const [nodeId, node] of Object.entries(block.nodes)) {
      validateNode(nodeId, node, blockId, allBlocks, errors);
    }
  }

  // Validate connections
  if (block.conns) {
    const nodeIds = new Set(Object.keys(block.nodes || {}));
    for (let i = 0; i < block.conns.length; i++) {
      validateConnection(block.conns[i], i, blockId, nodeIds, errors);
    }
  }
}

function validateNode(
  nodeId: string,
  node: Node,
  blockId: string,
  allBlocks: Record<string, Block>,
  errors: ValidationError[]
): void {
  // Validate node type
  if (!VALID_NODE_TYPES.includes(node.type)) {
    errors.push({
      message: `Invalid node type "${node.type}" in node "${nodeId}"`,
      path: `blocks.${blockId}.nodes.${nodeId}.type`
    });
  }

  // Validate block reference for inst type
  if (node.type === 'inst' && node.block) {
    if (!allBlocks[node.block]) {
      errors.push({
        message: `Referenced block "${node.block}" not found (in node "${nodeId}")`,
        path: `blocks.${blockId}.nodes.${nodeId}.block`
      });
    }
  }

  // Validate mux has inputs
  if (node.type === 'mux' && (!node.inputs || node.inputs < 2)) {
    errors.push({
      message: `Mux "${nodeId}" must have at least 2 inputs`,
      path: `blocks.${blockId}.nodes.${nodeId}.inputs`
    });
  }

  // Validate arbiter has masters
  if (node.type === 'arbiter' && (!node.masters || node.masters < 2)) {
    errors.push({
      message: `Arbiter "${nodeId}" must have at least 2 masters`,
      path: `blocks.${blockId}.nodes.${nodeId}.masters`
    });
  }
}

function validateConnection(
  conn: Connection,
  index: number,
  blockId: string,
  nodeIds: Set<string>,
  errors: ValidationError[]
): void {
  // Extract base node id (without port)
  const fromNode = conn.from.split(':')[0];
  const toNode = conn.to.split(':')[0];

  // Skip validation for pattern references (will be expanded by preprocessor)
  // Includes: range [0..3], wildcard [*], single index [0]
  const isPattern = (ref: string) => /\[\d+\.\.\d+\]$/.test(ref) || /\[\*\]$/.test(ref) || /\[\d+\]$/.test(ref);

  if (!isPattern(fromNode) && !nodeIds.has(fromNode)) {
    errors.push({
      message: `Connection references unknown node "${fromNode}"`,
      path: `blocks.${blockId}.conns[${index}].from`
    });
  }

  if (!isPattern(toNode) && !nodeIds.has(toNode)) {
    errors.push({
      message: `Connection references unknown node "${toNode}"`,
      path: `blocks.${blockId}.conns[${index}].to`
    });
  }
}
