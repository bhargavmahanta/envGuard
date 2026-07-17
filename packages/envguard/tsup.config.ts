import { defineConfig } from 'tsup';

const shared = {
  target: 'node20' as const,
  sourcemap: true,
  splitting: false,
  treeshake: true
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      'reporters/index': 'src/reporters/index.ts'
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    }
  },
  {
    ...shared,
    entry: { cli: 'src/cli-entry.ts' },
    format: ['esm'],
    dts: false,
    clean: false
  }
]);
