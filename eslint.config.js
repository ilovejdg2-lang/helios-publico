import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results', 'artifacts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Los textos del label viven en spans anidados (título + detalle), de ahí la profundidad.
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 4 }],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
      },
    },
  },
)
