declare module "bun:test" {
  export function bench(name: string, fn: () => void | Promise<void>): void;
  export function bench(
    name: string,
    fn: () => void | Promise<void>,
    options: { iterations?: number },
  ): void;
  export function run(options?: { iterations?: number }): Promise<void>;
}
