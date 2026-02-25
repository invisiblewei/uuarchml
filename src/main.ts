/**
 * uuarckml Web 应用主入口
 */

import { parseDSL, renderToSVG, createAIAssistant } from './index';

// 示例 DSL
const EXAMPLES = {
  riscv: `chip riscv_cpu {
  module pc_reg {
    input clk: clk
    input rst_n: rst_n
    input pc_next: addr_t
    output pc: addr_t
  }
  
  module fetch {
    input pc: addr_t
    output instr: data_t
    output pc_plus4: addr_t
  }
  
  module decode {
    input instr: data_t
    input pc: addr_t
    output rs1_addr: addr_t
    output rs2_addr: addr_t
    output rd_addr: addr_t
    output imm: data_t
    output alu_op: control_t
    output branch_type: control_t
  }
  
  module regfile {
    input rs1_addr: addr_t
    input rs2_addr: addr_t
    input rd_addr: addr_t
    input rd_data: data_t
    input reg_write: control_t
    output rs1_data: data_t
    output rs2_data: data_t
  }
  
  module execute {
    input rs1_data: data_t
    input rs2_data: data_t
    input imm: data_t
    input pc: addr_t
    input alu_op: control_t
    input alu_src: control_t
    output alu_result: data_t
    output branch_taken: control_t
    output branch_target: addr_t
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
    input pc_plus4: addr_t
    input mem_to_reg: control_t
    input jump: control_t
    output rd_data: data_t
  }
  
  datapath if_stage pc_reg -> fetch
  datapath id_stage fetch -> decode -> regfile
  datapath ex_stage regfile -> execute
  datapath mem_stage execute -> memory
  datapath wb_stage memory -> writeback -> regfile
}`,

  fifo: `chip async_fifo {
  module write_clk_domain {
    input wr_clk: clk
    input wr_rst_n: rst_n
    input wr_en: control_t
    input wr_data: data_t
    output full: control_t
    output almost_full: control_t
    output wr_ptr: addr_t
  }
  
  module read_clk_domain {
    input rd_clk: clk
    input rd_rst_n: rst_n
    input rd_en: control_t
    output rd_data: data_t
    output empty: control_t
    output almost_empty: control_t
    output rd_ptr: addr_t
  }
  
  module dual_port_ram {
    input wr_clk: clk
    input wr_en: control_t
    input wr_addr: addr_t
    input wr_data: data_t
    input rd_clk: clk
    input rd_addr: addr_t
    output rd_data: data_t
  }
  
  module sync_wr_to_rd {
    input rd_clk: clk
    input wr_ptr: addr_t
    output wr_ptr_sync: addr_t
  }
  
  module sync_rd_to_wr {
    input wr_clk: clk
    input rd_ptr: addr_t
    output rd_ptr_sync: addr_t
  }
  
  datapath write write_clk_domain -> dual_port_ram
  datapath read dual_port_ram -> read_clk_domain
}`,

  axi: `chip axi_interconnect {
  module axi_master_if {
    // AW channel
    output awid: id_t
    output awaddr: addr_t
    output awvalid: control_t
    input awready: control_t
    // W channel
    output wdata: data_t
    output wstrb: strb_t
    output wvalid: control_t
    input wready: control_t
    // AR channel
    output arid: id_t
    output araddr: addr_t
    output arvalid: control_t
    input arready: control_t
    // R channel
    input rid: id_t
    input rdata: data_t
    input rvalid: control_t
    output rready: control_t
  }
  
  module axi_slave_if {
    input awid: id_t
    input awaddr: addr_t
    input awvalid: control_t
    output awready: control_t
    input wdata: data_t
    input wstrb: strb_t
    input wvalid: control_t
    output wready: control_t
    output bid: id_t
    output bresp: resp_t
    output bvalid: control_t
    input bready: control_t
  }
  
  module addr_decoder {
    input addr: addr_t
    output slave_sel: sel_t
  }
  
  module arbiter {
    input req: req_t
    output grant: grant_t
  }
  
  datapath write axi_master_if -> arbiter -> addr_decoder -> axi_slave_if
  datapath read axi_master_if -> arbiter -> addr_decoder -> axi_slave_if
}`
};

// DOM 元素
const dslInput = document.getElementById('dsl-input') as HTMLTextAreaElement;
const errorMsg = document.getElementById('error-msg') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLDivElement;
const btnRender = document.getElementById('btn-render') as HTMLButtonElement;
const btnRtl = document.getElementById('btn-rtl') as HTMLButtonElement;
const aiPrompt = document.getElementById('ai-prompt') as HTMLInputElement;
const btnAiGenerate = document.getElementById('ai-generate') as HTMLButtonElement;

// 渲染函数
function render() {
  const dsl = dslInput.value;
  errorMsg.textContent = '';
  
  const result = parseDSL(dsl);
  
  if (!result.success || !result.design) {
    errorMsg.textContent = result.errors?.map(e => 
      `Line ${e.line}: ${e.message}`
    ).join('\n') || '解析错误';
    return;
  }
  
  const renderResult = renderToSVG(result.design, {
    theme: 'light',
    showGrid: true
  });
  
  canvas.innerHTML = renderResult.svg;
  canvas.style.width = `${renderResult.width}px`;
  canvas.style.height = `${renderResult.height}px`;
}

// AI 生成
async function generateWithAI() {
  const prompt = aiPrompt.value.trim();
  if (!prompt) return;
  
  btnAiGenerate.textContent = '生成中...';
  btnAiGenerate.disabled = true;
  
  try {
    // 模拟 AI 响应（实际应该调用 API）
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单的关键词匹配
    const lowerPrompt = prompt.toLowerCase();
    let dsl = '';
    
    if (lowerPrompt.includes('cpu') || lowerPrompt.includes('处理器')) {
      dsl = EXAMPLES.riscv;
    } else if (lowerPrompt.includes('fifo') || lowerPrompt.includes('队列')) {
      dsl = EXAMPLES.fifo;
    } else if (lowerPrompt.includes('axi') || lowerPrompt.includes('总线')) {
      dsl = EXAMPLES.axi;
    } else {
      dsl = `chip design {
  module top {
    input clk: clk
    input rst_n: rst_n
    input data_in: data_t
    output data_out: data_t
  }
  
  module processing {
    input data: data_t
    output result: data_t
  }
  
  datapath main top -> processing -> top
}`;
    }
    
    dslInput.value = dsl;
    render();
  } finally {
    btnAiGenerate.textContent = '生成';
    btnAiGenerate.disabled = false;
  }
}

// 导出 RTL
function exportRTL() {
  const dsl = dslInput.value;
  const result = parseDSL(dsl);
  
  if (!result.success || !result.design) {
    alert('请先修复 DSL 错误');
    return;
  }
  
  const assistant = createAIAssistant('');
  const rtl = assistant.generateRTL(result.design, 'systemverilog');
  
  const blob = new Blob([rtl], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.design.name || 'design'}.sv`;
  a.click();
  URL.revokeObjectURL(url);
}

// 加载示例
function loadExample(key: string) {
  const example = EXAMPLES[key as keyof typeof EXAMPLES];
  if (example) {
    dslInput.value = example;
    render();
  }
}

// 事件监听
btnRender.addEventListener('click', render);
btnRtl.addEventListener('click', exportRTL);
btnAiGenerate.addEventListener('click', generateWithAI);

aiPrompt.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') generateWithAI();
});

// 示例按钮
document.querySelectorAll('.example-item').forEach(item => {
  item.addEventListener('click', () => {
    const key = (item as HTMLElement).dataset.example || '';
    loadExample(key);
  });
});

// 初始渲染
render();
