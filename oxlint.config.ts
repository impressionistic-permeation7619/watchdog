import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";

const watchdogIgnores = [
  "_legacy-v1/**",
  "_legacy-v2/**",
  ".direnv/**",
  "graph/**",
  "data/**",
  "staging/**",
  "export/**",
  "reports/**",
  "templates/**",
  "**/routeTree.gen.ts",
  "packages/client/src/generated/**",
  "packages/caps/capabilities.gen.json",
  "packages/db/drizzle/**",
  "**/dist/**",
  "node_modules/**",
  // Better Auth UI + shadcn registry — do not lint
  "apps/web/src/auth/ui/**",
  "apps/web/src/shared/ui/shadcn/**",
  ".cursor/**",
  ".agents/**",
  ".claude/**",
  ".kiro/**",
  "skills/**",
];

export default defineConfig({
  extends: [core, react, tanstack],
  ignorePatterns: [...(core.ignorePatterns ?? []), ...watchdogIgnores],
  options: {
    typeAware: true,
  },
  // React Doctor only — not the full Ultracite js-plugins (github/sonarjs).
  jsPlugins: [
    { name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
  ],
  rules: {
    // --- Permanent off: low signal / huge churn (lint debt burn-down P7) ---
    // reconsider curly only with proven safe autofix
    "eslint/curly": "off",
    // declaration vs expression holy war
    "eslint/func-style": "off",
    // often worse readability
    "eslint/prefer-destructuring": "off",
    // regex churn, little safety
    "eslint/prefer-named-capture-group": "off",
    // object key order noise
    "eslint/sort-keys": "off",
    // oxfmt import sort owns style
    "import/consistent-type-specifier-style": "off",
    // custom Queue listboxes are not native select/datalist
    "jsx-a11y/prefer-tag-over-role": "off",
    // intentional public API barrels (schemas etc.)
    "oxc/no-barrel-file": "off",
    // .toSorted needs ES2023; tsconfig is ES2022
    "unicorn/no-array-sort": "off",
    // fights promise-function-async on framework handlers that must be async
    // but only forward a Promise (TanStack / oRPC / mapDomainError)
    "eslint/require-await": "off",
    // unicode flag churn on every regex; low safety signal here
    "eslint/require-unicode-regexp": "off",
    // ~100+ hits of mechanical truthiness churn; dedicated milestone later
    "typescript/strict-boolean-expressions": "off",
    // script/JSDoc noise — descriptions aren't our lint bar
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns-description": "off",

    // --- Burn-down backlog (tighten gradually; see lint debt plan) ---
    "eslint/complexity": "off",
    "eslint/eqeqeq": "error",
    "eslint/logical-assignment-operators": "error",
    "eslint/no-control-regex": "error",
    "eslint/no-empty-function": "error",
    "eslint/no-eq-null": "error",
    "eslint/no-misleading-character-class": "error",
    "eslint/no-negated-condition": "error",
    // P4/P5/P6 medium rules — already clean; enforced as error
    "eslint/no-nested-ternary": "error",
    "eslint/no-plusplus": "error",
    "eslint/no-await-in-loop": "error",
    "eslint/no-shadow": "error",
    "eslint/no-unused-vars": "error",
    "eslint/no-use-before-define": "error",
    "eslint/preserve-caught-error": "error",
    "import/no-cycle": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/control-has-associated-label": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/no-noninteractive-element-interactions": "error",
    "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "promise/prefer-await-to-callbacks": "error",
    "promise/prefer-await-to-then": "error",
    "react/button-has-type": "error",
    "react/display-name": "error",
    "react/jsx-handler-names": "error",
    "react/jsx-no-constructed-context-values": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/no-danger": "error",
    "react/no-object-type-as-default-prop": "error",
    "react/no-unescaped-entities": "error",
    "react/no-unstable-nested-components": "error",
    "react/react-compiler": "error",
    "react-hooks/exhaustive-deps": "error",
    "typescript/array-type": "error",
    "typescript/ban-ts-comment": "error",
    "typescript/consistent-indexed-object-style": "error",
    "typescript/consistent-return": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-base-to-string": "error",
    "typescript/no-confusing-void-expression": "error",
    "typescript/no-deprecated": "error",
    "typescript/no-dynamic-delete": "error",
    "typescript/no-floating-promises": [
      "error",
      {
        // vitest `describe`/`it` at module scope are fire-and-forget registration.
        allowForKnownSafeCalls: [
          {
            from: "package",
            name: ["describe", "it", "test"],
            package: "vitest",
          },
        ],
      },
    ],
    "typescript/no-invalid-void-type": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-redundant-type-constituents": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-conversion": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-unused-vars": "error",
    "typescript/only-throw-error": "error",
    "typescript/prefer-nullish-coalescing": "error",
    "typescript/promise-function-async": "error",
    "typescript/restrict-template-expressions": "error",
    "typescript/return-await": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/use-unknown-in-catch-callback-variable": "error",
    "unicorn/consistent-function-scoping": "error",
    "unicorn/import-style": "error",
    "unicorn/no-array-for-each": "error",
    "unicorn/no-array-reduce": "error",

    "unicorn/no-await-expression-member": "error",
    "unicorn/no-document-cookie": "error",
    "unicorn/no-hex-escape": "error",
    "unicorn/no-negated-condition": "error",
    "unicorn/no-nested-ternary": "error",
    "unicorn/no-useless-collection-argument": "error",
    "unicorn/prefer-array-find": "error",
    "unicorn/prefer-export-from": [
      "error",
      // Barrel files (e.g. packages/api/src/schemas.ts) legitimately both use
      // and re-export the same imported schema — don't flag those as
      // redundant just because a subset is also re-exported.
      { checkUsedVariables: false },
    ],
    "unicorn/prefer-logical-operator-over-ternary": "error",
    "unicorn/prefer-number-coercion": "error",
    "unicorn/prefer-single-call": "error",
    "unicorn/prefer-string-replace-all": "error",
    "unicorn/prefer-ternary": "error",
    "react-doctor/effect-needs-cleanup": "error",
    "react-doctor/no-array-index-as-key": "error",
    "react-doctor/no-async-effect-callback": "error",
    "react-doctor/no-derived-state": "error",
    "react-doctor/no-derived-state-effect": "error",
    "react-doctor/no-fetch-in-effect": "error",
    "react/only-export-components": [
      "error",
      {
        allowConstantExport: true,
        allowExportNames: [
          "Route",
          "loader",
          "meta",
          "links",
          "headers",
          "action",
        ],
        customHOCs: [
          "createFileRoute",
          "createRootRoute",
          "createRootRouteWithContext",
        ],
      },
    ],
  },
  overrides: [
    {
      // TanStack file routes export `Route` for the route tree generator.
      files: ["**/routes/**/*.{ts,tsx}", "**/src/routes/**/*.{ts,tsx}"],
      rules: {
        "typescript/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
            varsIgnorePattern: "^(_|Route)$",
          },
        ],
      },
    },
    {
      // Web must not import @watchdog/db except auth adapter + SSE listen.
      files: ["apps/web/src/**/*.{ts,tsx}"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "@watchdog/db",
                message:
                  "ServerFns call oRPC (@watchdog/api) → core → repos. Only auth/server.ts and routes/api/events.ts may import @watchdog/db.",
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        "apps/web/src/auth/server.ts",
        "apps/web/src/routes/api/events.ts",
      ],
      rules: {
        "eslint/no-restricted-imports": "off",
      },
    },
    {
      // shadcn registry primitives — not hand-owned DS.
      files: ["apps/web/src/shared/ui/shadcn/**/*.{ts,tsx}"],
      rules: {
        "eslint/no-unused-vars": "off",
        "typescript/no-unused-vars": "off",
        "react/only-export-components": "off",
        "react/react-compiler": "off",
        "unicorn/no-null": "off",
      },
    },
    {
      // shadcn-vendored hook — @ts-nocheck re-stamped by
      // apps/web/scripts/shadcn-nocheck.mjs; excluded from tsconfig by design.
      files: ["apps/web/src/shared/hooks/use-mobile.ts"],
      rules: {
        "typescript/ban-ts-comment": "off",
      },
    },
  ],
});
