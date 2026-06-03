/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@noun/eslint-config'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
}
