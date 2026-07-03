export type JsonSerializer = (obj: unknown) => string;

const SAFE_KEY_RE = /^[a-zA-Z_$][\w$]*$/;

function compileObjectSerializer(keys: string[]): (obj: Record<string, unknown>) => string {
  if (keys.length === 0) return () => "{}";
  if (!keys.every((k) => SAFE_KEY_RE.test(k))) {
    return (obj) => JSON.stringify(obj);
  }
  try {
    const keyJson = JSON.stringify(keys);
    return new Function(
      "o",
      `var r='{';var k=${keyJson};for(var i=0;i<k.length;i++){if(i>0)r+=',';r+=JSON.stringify(k[i])+':'+JSON.stringify(o[k[i]])}return r+'}'`,
    ) as (obj: Record<string, unknown>) => string;
  } catch {
    return (obj) => JSON.stringify(obj);
  }
}

export function createLazySerializer(): JsonSerializer {
  let compiled: JsonSerializer | null = null;
  return (obj: unknown) => {
    if (!compiled) {
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        const keys = Object.keys(obj);
        compiled = compileObjectSerializer(keys) as JsonSerializer;
      } else {
        compiled = JSON.stringify;
      }
    }
    return compiled(obj);
  };
}

function isSerializableObject(val: unknown): val is Record<string, unknown> {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return false;
  return typeof val === "object";
}

const fastStringifyCache = new Map<string, JsonSerializer>();

// fallow-ignore-next-line unused-export
export function fastStringify(val: unknown): string {
  if (typeof val === "string") return JSON.stringify(val);
  if (val === null) return "null";
  if (Array.isArray(val)) return JSON.stringify(val);
  if (isSerializableObject(val)) {
    const keys = Object.keys(val);
    const key = keys.join("\0");
    let serializer = fastStringifyCache.get(key);
    if (!serializer) {
      serializer = compileObjectSerializer(keys) as JsonSerializer;
      fastStringifyCache.set(key, serializer);
    }
    return serializer(val);
  }
  return JSON.stringify(val);
}
