import { watch } from 'chokidar';
import { readFileSync, writeFileSync } from 'fs';
import { processYAML } from 'uuarchml-core';
import { resolve } from 'path';

export async function watchFile(input: string, options: any): Promise<void> {
  const inputPath = resolve(input);

  console.log(`Watching: ${inputPath}`);
  console.log('Press Ctrl+C to stop\n');

  // Initial render
  await render(inputPath, options);

  // Watch
  const watcher = watch(inputPath, { ignoreInitial: true });

  watcher.on('change', async () => {
    console.log('\n[File changed]');
    await render(inputPath, options);
  });

  watcher.on('error', (error) => {
    console.error('Watch error:', error);
  });

  // Keep process alive
  return new Promise(() => {});
}

async function render(inputPath: string, options: any): Promise<void> {
  const startTime = Date.now();

  try {
    const yaml = readFileSync(inputPath, 'utf-8');
    const result = processYAML(yaml, {
      theme: options.theme,
      direction: options.direction
    });

    if (!result.success) {
      console.error('Errors:');
      for (const err of result.errors) {
        console.error(`  - ${err.message}`);
      }
      return;
    }

    const output = result.svg!;
    if (options.output) {
      writeFileSync(options.output, output);
      const elapsed = Date.now() - startTime;
      console.log(`✓ Generated ${options.output} (${elapsed}ms)`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}
