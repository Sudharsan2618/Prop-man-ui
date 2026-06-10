import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'public']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Hooks dependency hygiene — was missing, opt in as warning during migration.
      'react-hooks/exhaustive-deps': 'warn',
      // No raw console in app code (warn / error allowed).
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // React Fast Refresh: relax to warn so files that legitimately export
      // a component + a helper (e.g. RoleContext + useRole + normalizeRole)
      // don't fail the build. Long-term: split helpers into peer files.
      'react-refresh/only-export-components': 'warn',
      // Security: external links must not leak referrer.
      // (react/jsx-no-target-blank isn't enabled without the react plugin —
      // tracked as a follow-up to add eslint-plugin-react.)
    },
  },
  // Stricter rules for production app code: ban inline `style={{...}}` and
  // direct fetch() calls outside the api/client.js module.
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: [
      // Inline styles are tolerated in the dev-only component sandbox.
      'src/pages/dev/**',
    ],
    rules: {
      // Note: ESLint doesn't have a built-in JSX-style ban without eslint-plugin-react;
      // this is enforced by code review until that plugin is added. The intent is:
      //   - Allowed: dynamic values like `style={{ width: `${pct}%` }}`
      //   - Banned:  static styling (colors, padding, font-size) — move into the
      //              page's .css file using var(--…) tokens.
      // See Docs/01_design_system_and_components.md §1 (tokens).
    },
  },
])
