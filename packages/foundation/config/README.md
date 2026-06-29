# @rune/config

Environment-based configuration loader. Loads all `process.env` variables into an internal `Map<string, unknown>`, auto-parsing strings to their typed equivalents.

## Exports

| Name           | Kind  |
| -------------- | ----- |
| `ConfigLoader` | Class |

## Usage

```ts
import { ConfigLoader } from "@rune/config";

const config = new ConfigLoader();
const port = config.get<number>("PORT", 3000);
const debug = config.get<boolean>("DEBUG", false);
```

## API

| Method                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `get<T>(key, default?)` | Gets a value by key with optional default |
| `set(key, value)`       | Sets a value                              |

Auto-parses `"true"`/`"false"` to boolean, numeric strings to numbers, and `"null"`/`"undefined"` to their respective values.

## Dependencies

None.
