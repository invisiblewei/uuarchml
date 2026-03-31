import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Plugin to serve examples directory
const examplesPlugin = () => ({
  name: 'serve-examples',
  configureServer(server: any) {
    server.middlewares.use('/examples', (req: any, res: any, next: any) => {
      const examplesDir = resolve(__dirname, '../../examples');
      const filePath = resolve(examplesDir, req.url?.replace(/^\//, '') || '');

      // Security: ensure the file is within examples directory
      if (!filePath.startsWith(examplesDir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader('Content-Type', 'text/yaml');
        res.end(fs.readFileSync(filePath, 'utf-8'));
      } else {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
  }
});

export default defineConfig({
  resolve: {
    alias: {
      'uuarchml-core': resolve(__dirname, '../uuarchml-core/src/index.ts')
    }
  },
  plugins: [examplesPlugin()],
  server: {
    port: 5174,
    fs: {
      allow: [
        // Allow serving files from the playground directory
        resolve(__dirname),
        // Allow serving files from the core package
        resolve(__dirname, '../uuarchml-core'),
        // Allow serving examples
        resolve(__dirname, '../../examples')
      ]
    }
  }
});
