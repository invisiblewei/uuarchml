import { createEditor } from './editor.js';
import { PreviewManager } from './preview.js';
import { ExampleLoader } from './examples.js';

async function init() {
  const editorContainer = document.getElementById('editor-container')!;
  const previewContainer = document.getElementById('preview-container')!;
  const errorPanel = document.getElementById('error-panel')!;
  const renderBtn = document.getElementById('render-btn')!;
  const downloadBtn = document.getElementById('download-btn')!;
  const exampleSelect = document.getElementById('example-select')! as HTMLSelectElement;

  // Initialize editor with default content
  const editor = createEditor(editorContainer, '');

  // Initialize preview manager
  const preview = new PreviewManager(previewContainer, errorPanel);

  // Initialize example loader
  const examples = new ExampleLoader();

  // Load default example
  try {
    const defaultYaml = await examples.load('riscv_cpu.yaml');
    editor.setContent(defaultYaml);
    // Auto-render on load
    await preview.render(defaultYaml);
  } catch (e) {
    console.error('Failed to load default example:', e);
  }

  // Render button click handler
  renderBtn.addEventListener('click', async () => {
    const yaml = editor.getContent();
    await preview.render(yaml);
  });

  // Download button click handler
  downloadBtn.addEventListener('click', () => {
    preview.downloadSVG();
  });

  // Example selection handler
  exampleSelect.addEventListener('change', async () => {
    const filename = exampleSelect.value;
    if (!filename) return;

    try {
      const yaml = await examples.load(filename);
      editor.setContent(yaml);
      await preview.render(yaml);
    } catch (e) {
      console.error('Failed to load example:', e);
      alert(`加载示例失败: ${e}`);
    }
  });
}

init().catch(console.error);
