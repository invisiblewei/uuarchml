import type { Block, Connection } from '../types/ast.js';

export function expandBulkConnections(block: Block): Block {
  const nodeIds = Object.keys(block.nodes || {});
  const newConns: Connection[] = [];

  for (const conn of block.conns || []) {
    const expanded = expandConnection(conn, nodeIds);
    newConns.push(...expanded);
  }

  return {
    ...block,
    conns: newConns
  };
}

function expandConnection(conn: Connection, nodeIds: string[]): Connection[] {
  const fromPattern = parsePattern(conn.from);
  const toPattern = parsePattern(conn.to);

  // If neither side has pattern, keep as-is
  if (!fromPattern && !toPattern) {
    return [conn];
  }

  // Get matching nodes
  const fromMatches = fromPattern ? findMatchingNodes(fromPattern, nodeIds) : [conn.from];
  const toMatches = toPattern ? findMatchingNodes(toPattern, nodeIds) : [conn.to];

  // Determine mapping strategy
  const map = conn.map || 'broadcast';

  // If only one side has pattern, use broadcast (all pattern matches connect to single node)
  const isFromPattern = !!fromPattern;
  const isToPattern = !!toPattern;

  if (map === 'one-to-one' && isFromPattern && isToPattern) {
    // Both sides have patterns: pair up matches one-to-one
    const minLen = Math.min(fromMatches.length, toMatches.length);
    return Array.from({ length: minLen }, (_, i) => ({
      ...conn,
      from: fromMatches[i],
      to: toMatches[i]
    }));
  } else {
    // Broadcast: all from -> all to
    // This handles: single->pattern, pattern->single, pattern->pattern with broadcast
    const results: Connection[] = [];
    for (const from of fromMatches) {
      for (const to of toMatches) {
        results.push({ ...conn, from, to });
      }
    }
    return results;
  }
}

interface Pattern {
  base: string;
  type: 'range' | 'wildcard';
  start?: number;
  end?: number;
}

function parsePattern(ref: string): Pattern | null {
  // Match: base[0..3] or base[*] or base[0]
  const rangeMatch = ref.match(/^(.*)\[(\d+)\.\.(\d+)\]$/);
  if (rangeMatch) {
    return {
      base: rangeMatch[1],
      type: 'range',
      start: parseInt(rangeMatch[2]),
      end: parseInt(rangeMatch[3])
    };
  }

  const wildcardMatch = ref.match(/^(.*)\[\*\]$/);
  if (wildcardMatch) {
    return {
      base: wildcardMatch[1],
      type: 'wildcard'
    };
  }

  return null;
}

function findMatchingNodes(pattern: Pattern, nodeIds: string[]): string[] {
  if (pattern.type === 'range') {
    // Generate specific indices
    const matches: string[] = [];
    for (let i = pattern.start!; i <= pattern.end!; i++) {
      matches.push(`${pattern.base}[${i}]`);
    }
    return matches;
  } else {
    // Wildcard: find all nodes with matching base
    const regex = new RegExp(`^${pattern.base}\\[(\\d+)\]$`);
    return nodeIds
      .filter(id => regex.test(id))
      .sort((a, b) => {
        // Sort by index number
        const aMatch = a.match(/\[(\d+)\]$/);
        const bMatch = b.match(/\[(\d+)\]$/);
        return parseInt(aMatch?.[1] || '0') - parseInt(bMatch?.[1] || '0');
      });
  }
}
