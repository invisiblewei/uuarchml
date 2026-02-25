/**
 * Chip DSL 解析器
 * 将类 Mermaid 的文本描述解析为芯片设计结构
 * 
 * 示例 DSL：
 * ```
 * chip cpu {
 *   module fetch {
 *     input pc: addr_t
 *     output instr: data_t
 *   }
 *   module decode {
 *     input instr: data_t
 *     output ctrl: control_t
 *   }
 *   datapath fetch -> decode -> execute
 * }
 * ```
 */

import type { 
  ChipDesign, Module, Signal, Connection, DataPath,
  ParseResult, ParseError, DSLNode 
} from '@types/index';

/** Token 类型 */
type TokenType = 
  | 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING'
  | 'COLON' | 'SEMICOLON' | 'COMMA' | 'ARROW' | 'DOT'
  | 'LBRACE' | 'RBRACE' | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET'
  | 'ASSIGN' | 'NEWLINE' | 'EOF' | 'UNKNOWN';

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/** 关键字 */
const KEYWORDS = new Set([
  'chip', 'module', 'input', 'output', 'inout', 'internal',
  'datapath', 'connect', 'param', 'wire', 'reg', 'logic',
  'clock', 'reset', 'bus'
]);

export class DSLParser {
  private source: string = '';
  private tokens: Token[] = [];
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private errors: ParseError[] = [];

  /** 主入口：解析 DSL 文本 */
  parse(source: string): ParseResult {
    this.source = source;
    this.errors = [];
    
    try {
      this.tokenize();
      const design = this.parseChipDesign();
      
      return {
        success: this.errors.length === 0,
        design,
        errors: this.errors.length > 0 ? this.errors : undefined
      };
    } catch (e) {
      return {
        success: false,
        errors: this.errors
      };
    }
  }

  // ========== 词法分析 ==========

  private tokenize(): void {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.source.length) {
      this.skipWhitespace();
      
      if (this.position >= this.source.length) break;

      const char = this.source[this.position];
      const startLine = this.line;
      const startCol = this.column;

      // 注释
      if (char === '/' && this.peek(1) === '/') {
        this.skipLineComment();
        continue;
      }

      // 标识符或关键字
      if (this.isAlpha(char)) {
        const value = this.readIdentifier();
        this.tokens.push({
          type: KEYWORDS.has(value) ? 'KEYWORD' : 'IDENTIFIER',
          value,
          line: startLine,
          column: startCol
        });
        continue;
      }

      // 数字
      if (this.isDigit(char)) {
        this.tokens.push({
          type: 'NUMBER',
          value: this.readNumber(),
          line: startLine,
          column: startCol
        });
        continue;
      }

      // 字符串
      if (char === '"' || char === "'") {
        this.tokens.push({
          type: 'STRING',
          value: this.readString(),
          line: startLine,
          column: startCol
        });
        continue;
      }

      // 符号
      const symbol = this.readSymbol();
      if (symbol) {
        this.tokens.push({ type: symbol, value: char, line: startLine, column: startCol });
      }
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column });
  }

  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.tokens.push({ type: 'NEWLINE', value: '\n', line: this.line, column: this.column });
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (this.position < this.source.length && this.source[this.position] !== '\n') {
      this.advance();
    }
  }

  private readIdentifier(): string {
    let result = '';
    while (this.position < this.source.length && 
           (this.isAlphaNum(this.source[this.position]) || this.source[this.position] === '_')) {
      result += this.source[this.position];
      this.advance();
    }
    return result;
  }

  private readNumber(): string {
    let result = '';
    while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
      result += this.source[this.position];
      this.advance();
    }
    return result;
  }

  private readString(): string {
    const quote = this.source[this.position];
    this.advance(); // 跳过开始引号
    let result = '';
    while (this.position < this.source.length && this.source[this.position] !== quote) {
      result += this.source[this.position];
      this.advance();
    }
    this.advance(); // 跳过结束引号
    return result;
  }

  private readSymbol(): TokenType | null {
    const char = this.source[this.position];
    const next = this.peek(1);

    // 双字符符号
    if (char === '-' && next === '>') {
      this.advance();
      this.advance();
      return 'ARROW';
    }

    const symbols: Record<string, TokenType> = {
      ':': 'COLON', ';': 'SEMICOLON', ',': 'COMMA', '.': 'DOT',
      '{': 'LBRACE', '}': 'RBRACE',
      '(': 'LPAREN', ')': 'RPAREN',
      '[': 'LBRACKET', ']': 'RBRACKET',
      '=': 'ASSIGN'
    };

    if (symbols[char]) {
      this.advance();
      return symbols[char];
    }

    this.advance();
    return 'UNKNOWN';
  }

  // ========== 语法分析 ==========

  private parseChipDesign(): ChipDesign {
    this.expect('KEYWORD', 'chip');
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');

    const modules = new Map<string, Module>();
    const connections: Connection[] = [];
    const dataPaths: DataPath[] = [];

    while (!this.check('RBRACE') && !this.check('EOF')) {
      this.skipNewlines();
      
      if (this.check('KEYWORD', 'module')) {
        const module = this.parseModule();
        modules.set(module.id, module);
      } else if (this.check('KEYWORD', 'datapath')) {
        dataPaths.push(this.parseDataPath());
      } else if (this.check('KEYWORD', 'connect')) {
        connections.push(this.parseConnection());
      } else {
        this.error(`Unexpected token: ${this.current().value}`);
        this.advance();
      }
      
      this.skipNewlines();
    }

    this.expect('RBRACE');

    return {
      id: name,
      name,
      modules,
      connections,
      dataPaths,
      topModule: modules.size > 0 ? Array.from(modules.keys())[0] : undefined
    };
  }

  private parseModule(): Module {
    this.expect('KEYWORD', 'module');
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');

    const inputs: Signal[] = [];
    const outputs: Signal[] = [];
    const internals: Signal[] = [];

    while (!this.check('RBRACE') && !this.check('EOF')) {
      this.skipNewlines();

      if (this.check('KEYWORD', 'input')) {
        inputs.push(this.parseSignal('input'));
      } else if (this.check('KEYWORD', 'output')) {
        outputs.push(this.parseSignal('output'));
      } else if (this.check('KEYWORD', 'internal')) {
        internals.push(this.parseSignal('internal'));
      } else if (this.check('KEYWORD', 'param')) {
        // TODO: 解析参数
        this.skipUntil('NEWLINE');
      } else {
        this.error(`Unexpected in module: ${this.current().value}`);
        this.advance();
      }
    }

    this.expect('RBRACE');

    return {
      id: name,
      name,
      inputs,
      outputs,
      internals
    };
  }

  private parseSignal(direction: 'input' | 'output' | 'internal'): Signal {
    this.advance(); // 跳过关键字
    const name = this.expect('IDENTIFIER').value;
    
    let type: Signal['type'] = 'wire';
    let width: Signal['width'] = 1;

    if (this.check('COLON')) {
      this.advance();
      const typeName = this.expect('IDENTIFIER').value;
      // 简单类型映射，实际应该更复杂
      if (typeName.includes('addr')) type = 'bus';
      else if (typeName.includes('data')) type = 'bus';
      else if (typeName.includes('ctrl')) type = 'logic';
    }

    return { name, direction, type, width };
  }

  private parseDataPath(): DataPath {
    this.expect('KEYWORD', 'datapath');
    const name = this.check('IDENTIFIER') ? this.advance().value : undefined;
    
    const stages: string[] = [];
    stages.push(this.expect('IDENTIFIER').value);
    
    while (this.check('ARROW')) {
      this.advance();
      stages.push(this.expect('IDENTIFIER').value);
    }

    return {
      id: name || stages.join('_'),
      name,
      stages,
      isPipeline: false
    };
  }

  private parseConnection(): Connection {
    this.expect('KEYWORD', 'connect');
    // 简化实现
    this.skipUntil('NEWLINE');
    return { id: 'conn_' + Date.now(), from: { moduleId: '', signalName: '' }, to: { moduleId: '', signalName: '' } };
  }

  // ========== 辅助方法 ==========

  private current(): Token {
    return this.tokens[this.position] || this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    const token = this.current();
    if (this.position < this.tokens.length - 1) {
      this.position++;
    }
    return token;
  }

  private peek(offset: number): string {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : '';
  }

  private check(type: TokenType, value?: string): boolean {
    const token = this.current();
    return token.type === type && (value === undefined || token.value === value);
  }

  private expect(type: TokenType, value?: string): Token {
    if (!this.check(type, value)) {
      const expected = value ? `${type} '${value}'` : type;
      this.error(`Expected ${expected}, got '${this.current().value}'`);
    }
    return this.advance();
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) {
      this.advance();
    }
  }

  private skipUntil(type: TokenType): void {
    while (!this.check(type) && !this.check('EOF')) {
      this.advance();
    }
    if (this.check(type)) this.advance();
  }

  private error(message: string): void {
    const token = this.current();
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      severity: 'error'
    });
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlphaNum(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

/** 便捷函数 */
export function parseDSL(source: string): ParseResult {
  const parser = new DSLParser();
  return parser.parse(source);
}
