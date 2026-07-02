export type JsonSerializer = (obj: unknown) => string;

export function compileObjectSerializer(keys: string[]): (obj: Record<string, unknown>) => string {
  if (keys.length === 0) return () => "{}";
  const keyJson = JSON.stringify(keys);
  const fn = new Function(
    "o",
    `var r='{';var k=${keyJson};for(var i=0;i<k.length;i++){if(i>0)r+=',';r+=JSON.stringify(k[i])+':'+JSON.stringify(o[k[i]])}return r+'}'`,
  ) as (obj: Record<string, unknown>) => string;
  return fn;
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

export function isSerializableObject(val: unknown): val is Record<string, unknown> {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return false;
  return typeof val === "object";
}

export function fastStringify(val: unknown): string {
  if (typeof val === "string") return JSON.stringify(val);
  if (val === null) return "null";
  if (Array.isArray(val)) return JSON.stringify(val);
  if (isSerializableObject(val)) {
    const keys = Object.keys(val);
    const serializer = compileObjectSerializer(keys);
    return serializer(val);
  }
  return JSON.stringify(val);
}
