/**
 * uuarchml 主入口
 * 芯片架构设计可视化工具
 */

export { DSLParser, parseDSL } from '@parser/dsl';
export { SVGRenderer, renderToSVG } from '@renderer/svg';
export { AIAssistant, createAIAssistant } from '@ai/assistant';

export type {
  ChipDesign,
  Module,
  Signal,
  Connection,
  DataPath,
  ModuleInstance,
  SignalDirection,
  SignalType,
  BitWidth,
  ParseResult,
  ParseError,
  RenderConfig,
  RenderResult,
  RenderedElement,
  DesignSuggestion,
  AnalysisResult
} from '@types/index';

/** 版本 */
export const VERSION = '0.1.0';

/** 创建新的芯片设计 */
export function createChipDesign(name: string, id?: string): ChipDesign {
  return {
    id: id || name,
    name,
    modules: new Map(),
    connections: [],
    dataPaths: []
  };
}
