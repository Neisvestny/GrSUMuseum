import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    {
        // Глобальное игнорирование папок
        ignores: ['dist'],
    },
    {
        // Расширяем базовые рекомендации
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        files: ['**/*.{ts,tsx}'],
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
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            // ОТКЛЮЧАЕМ ПРОВЕРКУ ANY ТУТ:
            '@typescript-eslint/no-explicit-any': 'off',
            // Если вы хотите разрешить any в аргументах (spread):
            '@typescript-eslint/no-unsafe-argument': 'off',
        },
    },
);