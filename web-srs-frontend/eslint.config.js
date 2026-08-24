import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // ----------------------------------------------------------------------
      // BLOQUEIO ARQUITETURAL - REGRA UI01 (Estrito Flexbox)
      // ----------------------------------------------------------------------
      // Impede o uso de classes relacionadas com CSS Grid em qualquer componente
      // React. Em caso de infração, o linting falhará, interrompendo o CI/CD.
      'no-restricted-syntax': [
        'error',
        {
          // CORREÇÃO: Remoção do termo 'gap-' da Regex. O gap é perfeitamente válido no Flexbox.
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)(grid|inline-grid|grid-cols-|grid-rows-|col-span-|row-span-|auto-cols-|auto-rows-)/]",
          message: "🔴 [Violação UI01]: O uso de CSS Grid é expressamente vetado nesta arquitetura. Utilize estritamente Flexbox (flex, flex-col, etc)."
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)(grid|inline-grid|grid-cols-|grid-rows-|col-span-|row-span-|auto-cols-|auto-rows-)/]",
          message: "🔴 [Violação UI01]: O uso de CSS Grid é expressamente vetado nesta arquitetura. Utilize estritamente Flexbox (flex, flex-col, etc)."
        }
      ]

    },
  },
);
