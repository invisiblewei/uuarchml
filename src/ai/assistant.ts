/**
 * AI 交互模块
 * 自然语言描述 → 结构化图表 → DSL 代码
 */

import type { ChipDesign, Module, ParseResult } from '@types/index';
import { parseDSL } from '@parser/dsl';

/** AI 生成的设计建议 */
export interface DesignSuggestion {
  type: 'module' | 'connection' | 'datapath' | 'optimization';
  description: string;
  dslCode?: string;
  reason?: string;
}

/** AI 分析结果 */
export interface AnalysisResult {
  summary: string;
  suggestions: DesignSuggestion[];
  potentialIssues: string[];
  metrics?: {
    moduleCount: number;
    connectionCount: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
  };
}

export class AIAssistant {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.kimi.com/coding/') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 自然语言描述转 DSL
   * 示例："设计一个 RISC-V 五级流水线 CPU，包含取指、译码、执行、访存、写回"
   */
  async naturalLanguageToDSL(description: string): Promise<{
    dsl: string;
    explanation: string;
  }> {
    const prompt = `你是一个芯片架构设计专家。请将以下自然语言描述转换为 Chip DSL 格式。

Chip DSL 语法规范：
\`\`\`
chip <芯片名> {
  module <模块名> {
    input <信号名>: <类型>
    output <信号名>: <类型>
    internal <信号名>: <类型>
  }
  
  // 数据通路定义
  datapath <通路名> <模块1> -> <模块2> -> <模块3>
  
  // 连接定义
  connect <模块1>.<信号> -> <模块2>.<信号>
}
\`\`\`

类型可以是：addr_t（地址）、data_t（数据）、control_t（控制信号）、clk（时钟）、rst_n（复位）

用户描述：
${description}

请输出：
1. DSL 代码（放在 \`\`\`chip 代码块中）
2. 设计说明（关键设计决策的解释）`;

    // 这里应该调用实际的 AI API
    // 现在返回模拟结果
    return this.mockNaturalLanguageToDSL(description);
  }

  /**
   * 分析现有设计
   */
  async analyzeDesign(design: ChipDesign): Promise<AnalysisResult> {
    const suggestions: DesignSuggestion[] = [];
    const issues: string[] = [];

    // 分析模块数量
    const moduleCount = design.modules.size;
    if (moduleCount > 20) {
      suggestions.push({
        type: 'optimization',
        description: '设计包含较多模块，建议考虑分层组织',
        reason: '过多的顶层模块会降低可读性'
      });
    }

    // 分析未连接的信号
    design.modules.forEach((module, id) => {
      const unconnectedInputs = module.inputs.filter(input => {
        return !design.connections.some(c => 
          c.to.moduleId === id && c.to.signalName === input.name
        );
      });
      
      if (unconnectedInputs.length > 0) {
        issues.push(`${id} 模块有未连接的输入: ${unconnectedInputs.map(s => s.name).join(', ')}`);
      }
    });

    // 分析数据通路完整性
    design.dataPaths.forEach(dp => {
      const missingModules = dp.stages.filter(stage => !design.modules.has(stage));
      if (missingModules.length > 0) {
        issues.push(`数据通路 "${dp.name}" 引用了不存在的模块: ${missingModules.join(', ')}`);
      }
    });

    return {
      summary: `设计包含 ${moduleCount} 个模块，${design.connections.length} 条连接，${design.dataPaths.length} 条数据通路`,
      suggestions,
      potentialIssues: issues,
      metrics: {
        moduleCount,
        connectionCount: design.connections.length,
        estimatedComplexity: moduleCount < 5 ? 'low' : moduleCount < 15 ? 'medium' : 'high'
      }
    };
  }

  /**
   * 生成 RTL 骨架代码
   */
  generateRTL(design: ChipDesign, target: 'verilog' | 'systemverilog' | 'vhdl' = 'systemverilog'): string {
    const lines: string[] = [];
    
    lines.push(`// Auto-generated ${target.toUpperCase()} from ChipViz`);
    lines.push(`// Design: ${design.name}`);
    lines.push(`// Generated at: ${new Date().toISOString()}`);
    lines.push('');

    if (target === 'systemverilog') {
      lines.push('`default_nettype none');
      lines.push('');
    }

    // 生成每个模块
    design.modules.forEach((module) => {
      lines.push(...this.generateModuleRTL(module, target));
      lines.push('');
    });

    if (target === 'systemverilog') {
      lines.push('`default_nettype wire');
    }

    return lines.join('\n');
  }

  /**
   * 验证 DSL 语法
   */
  validateDSL(dslCode: string): ParseResult {
    return parseDSL(dslCode);
  }

  // ========== 私有方法 ==========

  private mockNaturalLanguageToDSL(description: string): {
    dsl: string;
    explanation: string;
  } {
    const lowerDesc = description.toLowerCase();
    
    // 简单的模式匹配
    if (lowerDesc.includes('cpu') || lowerDesc.includes('处理器')) {
      return {
        dsl: `chip cpu {
  module fetch {
    input pc: addr_t
    input clk: clk
    input rst_n: rst_n
    output instr: data_t
    output pc_next: addr_t
  }
  
  module decode {
    input instr: data_t
    input pc: addr_t
    output rs1_addr: addr_t
    output rs2_addr: addr_t
    output rd_addr: addr_t
    output alu_op: control_t
    output imm: data_t
  }
  
  module execute {
    input rs1_data: data_t
    input rs2_data: data_t
    input imm: data_t
    input alu_op: control_t
    output result: data_t
    output zero: control_t
  }
  
  module memory {
    input addr: addr_t
    input write_data: data_t
    input mem_write: control_t
    input mem_read: control_t
    output read_data: data_t
  }
  
  module writeback {
    input alu_result: data_t
    input mem_data: data_t
    input mem_to_reg: control_t
    output rd_data: data_t
  }
  
  datapath pipeline fetch -> decode -> execute -> memory -> writeback
}`,
        explanation: '基于经典的五级 RISC-V 流水线设计。包含取指(IF)、译码(ID)、执行(EX)、访存(MEM)、写回(WB)五个阶段，数据通路清晰，便于后续 RTL 实现。'
      };
    }
    
    if (lowerDesc.includes('fifo') || lowerDesc.includes('队列')) {
      return {
        dsl: `chip fifo {
  module write_ctrl {
    input wr_en: control_t
    input clk: clk
    input rst_n: rst_n
    output wr_ptr: addr_t
    output full: control_t
  }
  
  module read_ctrl {
    input rd_en: control_t
    input clk: clk
    input rst_n: rst_n
    output rd_ptr: addr_t
    output empty: control_t
  }
  
  module mem_array {
    input wr_ptr: addr_t
    input rd_ptr: addr_t
    input wr_data: data_t
    input wr_en: control_t
    input clk: clk
    output rd_data: data_t
  }
  
  module status_ctrl {
    input wr_ptr: addr_t
    input rd_ptr: addr_t
    output full: control_t
    output empty: control_t
    output almost_full: control_t
  }
  
  datapath write write_ctrl -> mem_array
  datapath read mem_array -> read_ctrl
}`,
        explanation: '异步 FIFO 设计，包含读写控制、存储阵列和状态控制四个模块。支持满/空/将满标志，适用于跨时钟域数据传输。'
      };
    }

    // 默认返回简单设计
    return {
      dsl: `chip design {
  module top {
    input clk: clk
    input rst_n: rst_n
    input data_in: data_t
    output data_out: data_t
  }
  
  module processing {
    input data: data_t
    input valid: control_t
    output result: data_t
    output ready: control_t
  }
  
  datapath main top -> processing -> top
}`,
      explanation: '基础两模块设计，包含顶层接口和处理单元。可根据实际需求扩展更多模块和连接。'
    };
  }

  private generateModuleRTL(module: Module, target: string): string[] {
    const lines: string[] = [];
    
    if (target === 'systemverilog') {
      lines.push(`module ${module.name} (`);
      
      // 端口列表
      const ports: string[] = [];
      module.inputs.forEach(s => ports.push(`  input  logic ${this.signalDecl(s)}`));
      module.outputs.forEach(s => ports.push(`  output logic ${this.signalDecl(s)}`));
      
      lines.push(ports.join(',\n'));
      lines.push(');');
      
      // 内部信号
      if (module.internals && module.internals.length > 0) {
        lines.push('');
        lines.push('  // Internal signals');
        module.internals.forEach(s => {
          lines.push(`  logic ${this.signalDecl(s)};`);
        });
      }
      
      // 模块体（占位）
      lines.push('');
      lines.push('  // TODO: Implement module logic');
      lines.push('');
      lines.push('endmodule');
    }
    
    return lines;
  }

  private signalDecl(signal: { name: string; width: number | string }): string {
    if (signal.width === 1 || signal.width === 'auto') {
      return signal.name;
    }
    return `[${Number(signal.width) - 1}:0] ${signal.name}`;
  }
}

/** 便捷函数 */
export function createAIAssistant(apiKey: string, baseUrl?: string): AIAssistant {
  return new AIAssistant(apiKey, baseUrl);
}
