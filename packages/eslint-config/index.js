/**
 * The shared rule set for every workspace.
 *
 * Two tiers:
 *
 * - **must** — `error`. A violation is a defect: an untyped value, or an import that breaks the
 *   package layering. These fail `pnpm lint`.
 * - **should** — `warn`. Conventions that keep the code legible to whoever reads it next, human or
 *   model: say when an import is a type, keep a function small enough to hold in your head, do not
 *   leave a binding or a `console.log` behind. Warnings do not fail the build, so they are a nudge
 *   on the code you are touching rather than a wall.
 *
 * Both tiers are consumed by the ESLint 9 flat configs (server, ui, shared) and by the ESLint 8
 * `.eslintrc.js` files (the three Next apps), which is why this file is plain CommonJS.
 */

/** Tier one: never `any`. Every workspace sets this. */
const mustRules = {
  // Data must have a declared type. Use `unknown` plus narrowing, never `any`.
  '@typescript-eslint/no-explicit-any': 'error',
};

/** Tier two: the conventions. All `warn`. */
const shouldRules = {
  // --- Say what a thing is -------------------------------------------------------------------
  // A type-only import reads as a type and is erased at compile time. Inline, so a module that
  // exports both a type and a value still needs only one import statement.
  '@typescript-eslint/consistent-type-imports': [
    'warn',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  // One shape declaration style, so a reader knows where to look for a model.
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
  '@typescript-eslint/array-type': ['warn', { default: 'array' }],
  '@typescript-eslint/no-inferrable-types': 'warn',
  '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
  // `x!.y` asserts away a case the types say can happen. Narrow, or handle the miss.
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'warn',
  // `??` and `||` differ for '' and 0; primitives are left alone because there the choice is
  // deliberate, but a nullable object should use `??`.
  '@typescript-eslint/prefer-nullish-coalescing': [
    'warn',
    { ignorePrimitives: { string: true, number: true, boolean: true } },
  ],

  // --- Leave nothing behind ------------------------------------------------------------------
  // An unused binding is either dead code or a rename that was not finished.
  '@typescript-eslint/no-unused-vars': [
    'warn',
    { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
  ],
  // Debug output is not logging. The server has a logger; the apps have the toast store.
  'no-console': ['warn', { allow: ['warn', 'error'] }],

  // --- Plain control flow --------------------------------------------------------------------
  eqeqeq: ['warn', 'always', { null: 'ignore' }],
  'prefer-const': 'warn',
  'no-var': 'warn',
  'object-shorthand': ['warn', 'properties'],
  'prefer-template': 'warn',
  curly: ['warn', 'multi-line'],
  'no-else-return': ['warn', { allowElseIf: false }],
  // A ternary inside a ternary is a table. Write the table, or an early return.
  'no-nested-ternary': 'warn',
  // Reassigning a parameter hides where a value came from.
  'no-param-reassign': ['warn', { props: false }],

  // --- Units small enough to read ------------------------------------------------------------
  // These are ceilings, not targets. Crossing one is the signal to extract something.
  'max-params': ['warn', 4],
  'max-depth': ['warn', 4],
  complexity: ['warn', 15],
  'max-nested-callbacks': ['warn', 3],
  'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
};

/** Aliases that only exist inside an app. Importing one from a package means the layers slipped. */
const APP_ALIASES = [
  '@components/*',
  '@modules/*',
  '@layouts',
  '@pages/*',
  '@stores',
  '@services',
  '@hooks/*',
  '@utils/*',
  '@enums',
  '@interfaces',
  '@themes',
  '@styles/*',
];

const CLIMBING_RELATIVE = '../../../*';

/**
 * Layering, as `error`. Each of these has no violations today; the rule is what keeps it that way.
 * See `packages/ui/README.md` for the reasoning behind each one.
 */
const layerRules = {
  /** The three Next apps. */
  app: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@repo/ui/ui/*'],
            message:
              "Raw shadcn primitives are not for feature code. Import the wrapper from '@repo/ui/core', or run /create-core-component to add one.",
          },
          {
            group: [CLIMBING_RELATIVE],
            message: 'Three levels up is a path alias: @components, @modules, @stores, @utils, ...',
          },
        ],
      },
    ],
  },

  /** packages/ui. */
  ui: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: APP_ALIASES,
            message:
              'packages/ui cannot import an app. Take the value as a prop instead (README rule 3).',
          },
          {
            group: ['mobx', 'mobx-*'],
            message:
              'A component here may not read app state. Everything arrives through props (README rule 3).',
          },
          {
            group: ['@repo/ui', '@repo/ui/*'],
            message:
              'Inside the package, import the module that defines the component relatively (README rules 2 and 6).',
          },
        ],
        // `paths` is an exact match, so this catches `from '..'` without touching '../lib/cn'.
        paths: [
          {
            name: '..',
            message:
              'Import the defining module (../loaders/Spinner), never the barrel above it (README rule 6).',
          },
        ],
      },
    ],
  },

  /** packages/shared. */
  shared: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['react', 'react-*', 'next', 'next/*', '@repo/ui', '@repo/ui/*'],
            message:
              'packages/shared is pure TypeScript, consumed by the server as compiled CommonJS. React-aware types belong in @repo/ui/types.',
          },
        ],
      },
    ],
  },

  /** apps/server. */
  server: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@repo/ui', '@repo/ui/*', 'react', 'react-*'],
            message: 'The server shares code through @repo/shared, never through the React package.',
          },
        ],
      },
    ],
  },
};

module.exports = { mustRules, shouldRules, layerRules, APP_ALIASES };
