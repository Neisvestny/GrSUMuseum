import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'**/dist',
			'**/node_modules',
			'apps/server/src/generated/**',
			'**/.turbo',
		],
	},
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['apps/web/src/**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'off',

			'@typescript-eslint/consistent-type-imports': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/refs': 'off',
		},
	},
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: [
			'apps/server/src/**/*.ts',
			'apps/server/scripts/**/*.ts',
			'packages/**/*.ts',
			'apps/**/*.config.ts',
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.node,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-imports': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-restricted-properties': [
				'error',
				{
					object: 'process',
					property: 'env',
					message: 'Read environment variables only from src/env.ts (or env.ts loaded after dotenv in entry scripts).',
				},
			],
		},
	},
	{
		files: ['apps/server/src/env.ts', 'apps/server/scripts/**/*.ts', 'apps/server/prisma.config.ts'],
		rules: {
			'no-restricted-properties': 'off',
			'no-console': 'off',
		},
	},
	{
		files: ['apps/server/src/app/bootstrap.ts', 'apps/server/src/index.ts'],
		rules: {
			'no-console': 'off',
		},
	},
	prettier,
);
