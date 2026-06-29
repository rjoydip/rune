# @rune/tsconfig

Shared TypeScript configuration presets for the Rune monorepo.

## Presets

| File          | Extends     | Description                                                                                          |
| ------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `base.json`   | —           | Base config: ES2022, ESNext modules, bundler resolution, DOM libs, decorators, strict mode           |
| `node.json`   | `base.json` | Node.js variant: Node16 module/resolution, `@types/node` only                                        |
| `strict.json` | `base.json` | Ultra-strict: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` |

## Usage

```json
{
  "extends": "@rune/tsconfig/base.json",
  "include": ["src"]
}
```

## Dependencies

None (private config package).
