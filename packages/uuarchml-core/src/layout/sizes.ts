import type { NodeType } from '../types/ast.js';

export interface NodeSize {
  width: number;
  height: number;
}

export const DEFAULT_NODE_SIZES: Record<NodeType, NodeSize> = {
  inst: { width: 120, height: 60 },
  reg: { width: 60, height: 50 },
  mux: { width: 80, height: 60 },
  arbiter: { width: 60, height: 60 },
  fifo: { width: 100, height: 40 }
};

// Mux height scales with input count
export function getMuxSize(inputs: number): NodeSize {
  const baseHeight = 60;
  const heightPerInput = 20;
  return {
    width: 80,
    height: Math.max(baseHeight, inputs * heightPerInput)
  };
}

// Arbiter size scales with master count
export function getArbiterSize(masters: number): NodeSize {
  const baseSize = 60;
  const sizePerMaster = 15;
  return {
    width: baseSize + masters * sizePerMaster,
    height: baseSize + masters * sizePerMaster
  };
}
