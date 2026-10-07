import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
import reactX from "eslint-plugin-react-x";

export default [
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  {
    files: ["**/*.{js,jsx}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-x": reactX },
    rules: {
      ...js.configs.recommended.rules,
      ...reactX.configs.recommended.rules,
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
];
