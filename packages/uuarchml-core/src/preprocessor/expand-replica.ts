import type { Block, Node } from '../types/ast.js';

export function expandReplica(block: Block): Block {
  const newNodes: Record<string, Node> = {};

  for (const [nodeId, node] of Object.entries(block.nodes || {})) {
    if (node.replica && node.replica > 1) {
      // Expand to multiple instances: core -> core[0], core[1], ...
      for (let i = 0; i < node.replica; i++) {
        const newNodeId = `${nodeId}[${i}]`;
        newNodes[newNodeId] = { ...node };
        delete newNodes[newNodeId].replica;
      }
    } else if (node.replica === 1) {
      // replica: 1 becomes node[0]
      newNodes[`${nodeId}[0]`] = { ...node };
      delete newNodes[`${nodeId}[0]`].replica;
    } else {
      // No replica, keep as-is
      newNodes[nodeId] = node;
    }
  }

  return {
    ...block,
    nodes: newNodes
  };
}
