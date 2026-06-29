import { RuneApp } from "@rune/core";
import type { Context } from "@rune/core";
import { Module, Controller, Get, Post, Req } from "@rune/decorators";
import { GraphQLHandler } from "@rune/graphql";
import { buildSchema } from "graphql";

const schema = buildSchema(`
  type Query {
    hello: String
    greet(name: String!): String
  }

  type Mutation {
    echo(message: String!): String
  }
`);

const rootValue = {
  hello: () => "Hello from GraphQL!",
  greet: ({ name }: { name: string }) => `Hello, ${name}!`,
  echo: ({ message }: { message: string }) => message,
};

const graphqlHandler = new GraphQLHandler({
  schema,
  rootValue,
  graphiql: true,
});

@Controller("/graphql")
class GraphQLController {
  @Req()
  @Get("/")
  @Post("/")
  async graphql(context: Context) {
    return graphqlHandler.handleRequest(context.request);
  }

  @Get("/hello")
  hello() {
    return { message: "REST endpoint works too" };
  }
}

@Module({ controllers: [GraphQLController], providers: [], imports: [], exports: [] })
class AppModule {}

const app = new RuneApp();
app.registerModule(AppModule);

export default app;
