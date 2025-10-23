import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Disabled - types generated separately via tsc
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
