import { describe, it, expect } from 'vitest';
import { renderToSVG } from './index.js';
import type { LayoutResult } from '../types/layout.js';

describe('renderToSVG', () => {
  it('should render simple layout to SVG', () => {
    const layout: LayoutResult = {
      width: 400,
      height: 300,
      nodes: [
        {
          id: 'alu',
          x: 100,
          y: 100,
          width: 120,
          height: 60,
          ports: {}
        }
      ],
      edges: []
    };

    const svg = renderToSVG(layout);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('alu');
  });

  it('should render edges', () => {
    const layout: LayoutResult = {
      width: 400,
      height: 300,
      nodes: [
        { id: 'a', x: 50, y: 100, width: 60, height: 40, ports: {} },
        { id: 'b', x: 200, y: 100, width: 60, height: 40, ports: {} }
      ],
      edges: [
        {
          id: 'e1',
          from: { node: 'a' },
          to: { node: 'b' },
          points: [{ x: 80, y: 100 }, { x: 170, y: 100 }]
        }
      ]
    };

    const svg = renderToSVG(layout);
    expect(svg).toContain('<path');
  });

  it('should include viewBox', () => {
    const layout: LayoutResult = {
      width: 400,
      height: 300,
      nodes: [],
      edges: []
    };

    const svg = renderToSVG(layout);
    expect(svg).toContain('viewBox="0 0 400 300"');
  });
});