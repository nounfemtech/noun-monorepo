// ESLint v9 flat config — apps/web
// TypeScript files are excluded: @typescript-eslint/parser is not an explicit
// devDependency. TS correctness is covered by `tsc --noEmit` (type-check).
// TODO: add typescript-eslint once the shared ESLint setup is migrated to v9.
export default [
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {},
  },
  {
    ignores: ['**/*.{ts,tsx}', '.next/**', 'node_modules/**'],
  },
]
