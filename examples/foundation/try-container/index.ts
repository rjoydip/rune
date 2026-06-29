import { Container, Scope } from "@rune/container";

const container = new Container();

container.register({
  token: "config",
  useValue: { port: 3000, host: "localhost" },
  scope: Scope.Singleton,
});

container.register({
  token: "counter",
  useFactory: () => ({ count: 0 }),
  scope: Scope.Transient,
});

const config = container.resolve<{ port: number; host: string }>("config");
console.log(`Server: ${config.host}:${config.port}`);

const a = container.resolve<{ count: number }>("counter");
const b = container.resolve<{ count: number }>("counter");
console.log(`Different instances: ${a !== b}`);
