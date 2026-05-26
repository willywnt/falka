/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['*.md', '*.json', '*.yml', '*.yaml'],
      options: {
        plugins: [],
      },
    },
  ],
};

export default config;
