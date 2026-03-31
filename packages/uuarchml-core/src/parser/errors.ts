export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export class ParseErrorCollector {
  errors: ParseError[] = [];

  add(message: string, severity: 'error' | 'warning' = 'error', line?: number, column?: number) {
    this.errors.push({ message, severity, line, column });
  }

  hasErrors(): boolean {
    return this.errors.some(e => e.severity === 'error');
  }
}
