import { processYAML } from 'uuarchml-core';

export class PreviewManager {
  private container: HTMLElement;
  private errorPanel: HTMLElement;
  private currentSVG: string | null = null;

  constructor(container: HTMLElement, errorPanel: HTMLElement) {
    this.container = container;
    this.errorPanel = errorPanel;
  }

  async render(yaml: string): Promise<void> {
    // Clear previous content
    this.container.innerHTML = '';
    this.clearErrors();

    if (!yaml.trim()) {
      this.showPlaceholder('请输入 YAML 内容');
      return;
    }

    const result = processYAML(yaml);

    if (!result.success || !result.svg) {
      this.showErrors(result.errors);
      this.showPlaceholder('渲染失败，请查看错误信息');
      return;
    }

    this.currentSVG = result.svg;
    this.displaySVG(result.svg);
  }

  private displaySVG(svg: string): void {
    // Parse SVG to add styling
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.documentElement;

    // Ensure SVG has proper styling
    svgElement.style.maxWidth = '100%';
    svgElement.style.maxHeight = '100%';
    svgElement.style.background = '#ffffff';

    this.container.innerHTML = '';
    this.container.appendChild(svgElement);
  }

  private showPlaceholder(message: string): void {
    this.container.innerHTML = `<div class="placeholder">${message}</div>`;
  }

  private showErrors(errors: Array<{ message: string; path?: string }>): void {
    if (errors.length === 0) return;

    const html = errors.map(error => {
      const path = error.path ? `[${error.path}] ` : '';
      return `<div class="error-item">${path}${error.message}</div>`;
    }).join('');

    this.errorPanel.innerHTML = html;
    this.errorPanel.classList.add('visible');
  }

  private clearErrors(): void {
    this.errorPanel.innerHTML = '';
    this.errorPanel.classList.remove('visible');
  }

  downloadSVG(): void {
    if (!this.currentSVG) {
      alert('没有可下载的 SVG，请先渲染');
      return;
    }

    // Create blob and download
    const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `uuarchml-diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
}
