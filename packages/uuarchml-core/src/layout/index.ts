import dagre from 'dagre';
import type { UUArchMLGraph, Block, Node } from '../types/ast.js';
import type { LayoutResult, LayoutNode, LayoutEdge, PortPosition } from '../types/layout.js';
import type { Direction } from './port-rules.js';
import {
  getMuxPorts, getArbiterPorts, getFifoPorts, getRegPorts,
  calculatePortPositions
} from './port-rules.js';
import { DEFAULT_NODE_SIZES, getMuxSize, getArbiterSize } from './sizes.js';

export function calculateLayout(graph: UUArchMLGraph): LayoutResult {
  // Process only the top block for now
  const topBlock = findTopBlock(graph);
  if (!topBlock || !topBlock.nodes) {
    return { width: 0, height: 0, nodes: [], edges: [] };
  }

  const direction = graph.layout?.direction || 'LR';

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 80,
    marginx: 20,
    marginy: 20
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre
  for (const [nodeId, node] of Object.entries(topBlock.nodes)) {
    const size = getNodeSize(node);
    g.setNode(nodeId, { width: size.width, height: size.height, nodeData: node });
  }

  // Add edges to dagre
  if (topBlock.conns) {
    for (const conn of topBlock.conns) {
      // Strip port suffix for layout
      const fromNode = conn.from.split(':')[0];
      const toNode = conn.to.split(':')[0];

      if (fromNode !== toNode) {
        g.setEdge(fromNode, toNode, { connData: conn });
      }
    }
  }

  // Run layout
  dagre.layout(g);

  // Extract layout results
  const nodes: LayoutNode[] = [];
  const gNodes = g.nodes();

  for (const nodeId of gNodes) {
    const dagreNode = g.node(nodeId);
    if (!dagreNode) continue;

    const node = topBlock.nodes[nodeId];
    const size = getNodeSize(node);
    const ports = generatePorts(node, size.width, size.height, direction);

    nodes.push({
      id: nodeId,
      x: dagreNode.x,
      y: dagreNode.y,
      width: size.width,
      height: size.height,
      ports
    });
  }

  // Extract edges
  const edges: LayoutEdge[] = [];
  const gEdges = g.edges();

  for (let i = 0; i < gEdges.length; i++) {
    const e = gEdges[i];
    const edge = g.edge(e);
    const conn = edge?.connData;

    edges.push({
      id: conn?.id || `edge-${i}`,
      from: parseConnectionEndpoint(conn?.from || e.v),
      to: parseConnectionEndpoint(conn?.to || e.w),
      points: edge?.points || [],
      label: conn?.sig || conn?.interface
    });
  }

  // Calculate bounds
  const graphInfo = g.graph();
  const width = (graphInfo.width || 0) + 40;
  const height = (graphInfo.height || 0) + 40;

  return { width, height, nodes, edges };
}

function findTopBlock(graph: UUArchMLGraph): Block | null {
  for (const block of Object.values(graph.blocks)) {
    if (block.type === 'top') {
      return block;
    }
  }
  // If no top block, use first block
  const first = Object.values(graph.blocks)[0];
  return first || null;
}

function getNodeSize(node: Node): { width: number; height: number } {
  switch (node.type) {
    case 'mux':
      return getMuxSize(node.inputs || 2);
    case 'arbiter':
      return getArbiterSize(node.masters || 2);
    default:
      return DEFAULT_NODE_SIZES[node.type];
  }
}

function generatePorts(
  node: Node,
  width: number,
  height: number,
  direction: Direction
): Record<string, PortPosition> {
  let portMap: Record<string, PortPosition>;

  switch (node.type) {
    case 'mux':
      portMap = getMuxPorts(node.inputs || 2, direction);
      break;
    case 'arbiter':
      portMap = getArbiterPorts(node.masters || 2, direction);
      break;
    case 'fifo':
      portMap = getFifoPorts(direction);
      break;
    case 'reg':
      portMap = getRegPorts(direction);
      break;
    case 'inst':
    default:
      portMap = {};
      break;
  }

  return calculatePortPositions(portMap, width, height);
}

function parseConnectionEndpoint(endpoint: string): { node: string; port?: string } {
  const parts = endpoint.split(':');
  return {
    node: parts[0],
    port: parts[1]
  };
}
