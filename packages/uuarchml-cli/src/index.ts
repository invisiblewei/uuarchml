import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { processYAML } from 'uuarchml-core';
import { watchFile } from './watch/index.js';

const program = new Command();

program
  .name('uuarchml')
  .description('Chip architecture visualization tool')
  .version('0.1.0');

program
  .argument('<input>', 'input YAML file')
  .option('-f, --format <format>', 'output format (svg|mermaid)', 'svg')
  .option('-o, --output <file>', 'output file (default: stdout)')
  .option('-d, --direction <dir>', 'layout direction (LR|TB|RL|BT)')
  .option('-t, --theme <theme>', 'theme (default|dark|paper)', 'default')
  .option('-w, --watch', 'watch file for changes')
  .action(async (input, options) => {
    try {
      if (options.watch) {
        await watchFile(input, options);
      } else {
        await renderOnce(input, options);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function renderOnce(input: string, options: any) {
  // Read input file
  let yaml: string;
  try {
    yaml = readFileSync(input, 'utf-8');
  } catch (e) {
    console.error(`Error: Cannot read file "${input}"`);
    process.exit(2);
  }

  // Process
  const result = processYAML(yaml, {
    theme: options.theme,
    direction: options.direction
  });

  if (!result.success) {
    console.error('Validation errors:');
    for (const err of result.errors) {
      console.error(`  - ${err.message}${err.path ? ` (${err.path})` : ''}`);
    }
    process.exit(1);
  }

  // Output
  const output = result.svg!;
  if (options.output) {
    try {
      writeFileSync(options.output, output);
      console.log(`Generated: ${options.output}`);
    } catch (e) {
      console.error(`Error: Cannot write to "${options.output}"`);
      process.exit(3);
    }
  } else {
    console.log(output);
  }
}

program.parse();
