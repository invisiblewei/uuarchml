import type { RenderConfig } from '../types/render.js';

export interface Theme {
  background: string;
  grid: string;
  moduleFill: string;
  moduleStroke: string;
  moduleHeader: string;
  text: string;
  textMuted: string;
  connection: string;
  connectionData: string;
  connectionControl: string;
  connectionBypass: string;
  portInput: string;
  portOutput: string;
  portControl: string;
}

export const THEMES: Record<NonNullable<RenderConfig['theme']>, Theme> = {
  default: {
    background: '#ffffff',
    grid: '#e5e5e5',
    moduleFill: '#ffffff',
    moduleStroke: '#000000',
    moduleHeader: '#e2e8f0',
    text: '#000000',
    textMuted: '#666666',
    connection: '#000000',
    connectionData: '#000000',
    connectionControl: '#000000',
    connectionBypass: '#000000',
    portInput: '#000000',
    portOutput: '#000000',
    portControl: '#000000'
  },
  dark: {
    background: '#1a1a1a',
    grid: '#333333',
    moduleFill: '#2a2a2a',
    moduleStroke: '#ffffff',
    moduleHeader: '#334155',
    text: '#ffffff',
    textMuted: '#aaaaaa',
    connection: '#ffffff',
    connectionData: '#60a5fa',
    connectionControl: '#fbbf24',
    connectionBypass: '#34d399',
    portInput: '#60a5fa',
    portOutput: '#34d399',
    portControl: '#fbbf24'
  },
  paper: {
    background: '#fefce8',
    grid: '#fde68a',
    moduleFill: '#ffffff',
    moduleStroke: '#1f2937',
    moduleHeader: '#fef3c7',
    text: '#1f2937',
    textMuted: '#6b7280',
    connection: '#6b7280',
    connectionData: '#2563eb',
    connectionControl: '#d97706',
    connectionBypass: '#059669',
    portInput: '#2563eb',
    portOutput: '#059669',
    portControl: '#d97706'
  }
};
