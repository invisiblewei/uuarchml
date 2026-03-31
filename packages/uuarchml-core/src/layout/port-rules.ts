import type { NodeType } from '../types/ast.js';
import type { PortPosition } from '../types/layout.js';

export type Direction = 'LR' | 'TB' | 'RL' | 'BT';

export type PortMap = Record<string, PortPosition>;

// Mux ports: in0, in1, ..., out, sel
export function getMuxPorts(inputs: number, direction: Direction): PortMap {
  const ports: PortMap = {};

  // Data inputs
  for (let i = 0; i < inputs; i++) {
    ports[`in${i}`] = {
      x: 0,
      y: 0,
      side: getInputSide(direction)
    };
  }

  // Data output
  ports['out'] = {
    x: 0,
    y: 0,
    side: getOutputSide(direction)
  };

  // Select control
  ports['sel'] = {
    x: 0,
    y: 0,
    side: getControlSide(direction)
  };

  return ports;
}

// Arbiter ports: req0, req1, ..., grant0, grant1, ...
export function getArbiterPorts(masters: number, direction: Direction): PortMap {
  const ports: PortMap = {};

  for (let i = 0; i < masters; i++) {
    ports[`req${i}`] = {
      x: 0,
      y: 0,
      side: getInputSide(direction)
    };
    ports[`grant${i}`] = {
      x: 0,
      y: 0,
      side: getOutputSide(direction)
    };
  }

  return ports;
}

// FIFO ports: enq, deq, full, empty
export function getFifoPorts(direction: Direction): PortMap {
  return {
    enq: { x: 0, y: 0, side: getInputSide(direction) },
    deq: { x: 0, y: 0, side: getOutputSide(direction) },
    full: { x: 0, y: 0, side: getControlSide(direction) },
    empty: { x: 0, y: 0, side: oppositeSide(getControlSide(direction)) }
  };
}

// Register ports: in, out, en, rst
export function getRegPorts(direction: Direction): PortMap {
  return {
    in: { x: 0, y: 0, side: getInputSide(direction) },
    out: { x: 0, y: 0, side: getOutputSide(direction) },
    en: { x: 0, y: 0, side: oppositeSide(getOutputSide(direction)) },
    rst: { x: 0, y: 0, side: oppositeSide(getInputSide(direction)) }
  };
}

// Inst ports: dynamic based on block definition
export function getInstPorts(): PortMap {
  return {}; // Placeholder - inst ports from connections
}

// Helper functions
function getInputSide(dir: Direction): 'n' | 's' | 'e' | 'w' {
  switch (dir) {
    case 'LR': return 'w';
    case 'RL': return 'e';
    case 'TB': return 'n';
    case 'BT': return 's';
  }
}

function getOutputSide(dir: Direction): 'n' | 's' | 'e' | 'w' {
  switch (dir) {
    case 'LR': return 'e';
    case 'RL': return 'w';
    case 'TB': return 's';
    case 'BT': return 'n';
  }
}

function getControlSide(dir: Direction): 'n' | 's' | 'e' | 'w' {
  switch (dir) {
    case 'LR': return 's';
    case 'RL': return 's';
    case 'TB': return 'e';
    case 'BT': return 'e';
  }
}

function oppositeSide(side: 'n' | 's' | 'e' | 'w'): 'n' | 's' | 'e' | 'w' {
  const opposites: Record<string, 'n' | 's' | 'e' | 'w'> = { n: 's', s: 'n', e: 'w', w: 'e' };
  return opposites[side];
}

// Calculate actual port positions based on node dimensions
export function calculatePortPositions(
  ports: PortMap,
  width: number,
  height: number
): PortMap {
  const result: PortMap = {};
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Group ports by side
  const portsBySide: Record<string, string[]> = { n: [], s: [], e: [], w: [] };
  for (const [name, port] of Object.entries(ports)) {
    portsBySide[port.side].push(name);
  }

  // Calculate position for each port
  for (const [name, port] of Object.entries(ports)) {
    const sidePorts = portsBySide[port.side];
    const index = sidePorts.indexOf(name);
    const count = sidePorts.length;

    let x = 0, y = 0;
    const spacing = 20; // 端口间距

    switch (port.side) {
      case 'n':
        x = count > 1 ? -((count - 1) * spacing) / 2 + index * spacing : 0;
        y = -halfHeight;
        break;
      case 's':
        x = count > 1 ? -((count - 1) * spacing) / 2 + index * spacing : 0;
        y = halfHeight;
        break;
      case 'e':
        x = halfWidth;
        y = count > 1 ? -((count - 1) * spacing) / 2 + index * spacing : 0;
        break;
      case 'w':
        x = -halfWidth;
        y = count > 1 ? -((count - 1) * spacing) / 2 + index * spacing : 0;
        break;
    }

    result[name] = { ...port, x, y };
  }

  return result;
}
