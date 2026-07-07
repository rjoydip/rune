import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState, UserService } from "../index";

describe("auth-service - UserService", () => {
  beforeEach(async () => {
    await resetState();
  });

  it("UserService.register returns user data without password", async () => {
    const userService = app.container.resolve(UserService);
    const registered = await userService.register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(registered.id).toBeDefined();
    expect(registered.username).toBe("testuser");
    expect(registered.email).toBe("test@example.com");
    expect((registered as any).password).toBeUndefined();
  });

  it("UserService.getUserById returns null when not found", async () => {
    const userService = app.container.resolve(UserService);
    const user = await userService.getUserById("nonexistent-id");
    expect(user).toBeNull();
  });

  it("UserService.login returns token when credentials are valid", async () => {
    const userService = app.container.resolve(UserService);
    await userService.register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    const result = await userService.login("test@example.com", "password123");
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });

  it("UserService.login throws error when password is incorrect", async () => {
    const userService = app.container.resolve(UserService);
    await userService.register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    await expect(userService.login("test@example.com", "wrongpassword")).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("UserService.getUser returns user when found by email", async () => {
    const userService = app.container.resolve(UserService);
    await userService.register({
      username: "emailuser",
      email: "email@example.com",
      password: "password123",
    });

    const user = await userService.getUser("email@example.com");
    expect(user).toBeDefined();
    expect(user?.username).toBe("emailuser");
    expect(user?.email).toBe("email@example.com");
    expect((user as any)?.password).toBeUndefined();
    expect(user?.createdAt).toBeDefined();
  });

  it("UserService.getUser returns null when email not found", async () => {
    const userService = app.container.resolve(UserService);
    const user = await userService.getUser("nonexistent@example.com");
    expect(user).toBeNull();
  });

  it("UserService.getUserById returns user when found", async () => {
    const userService = app.container.resolve(UserService);
    const registered = await userService.register({
      username: "iduser",
      email: "id@example.com",
      password: "password123",
    });

    const user = await userService.getUserById(registered.id);
    expect(user).toBeDefined();
    expect(user?.username).toBe("iduser");
    expect(user?.email).toBe("id@example.com");
    expect((user as any)?.password).toBeUndefined();
  });

  it("UserService.getUserById returns null when not found", async () => {
    const userService = app.container.resolve(UserService);
    const user = await userService.getUserById("nonexistent-id");
    expect(user).toBeNull();
  });

  it("UserService.getUserByToken returns user when token is valid", async () => {
    const userService = app.container.resolve(UserService);
    await userService.register({
      username: "tokenuser",
      email: "token@example.com",
      password: "password123",
    });

    const { token } = await userService.login("token@example.com", "password123");
    const user = await userService.getUserByToken(token);
    expect(user).toBeDefined();
    expect(user?.email).toBe("token@example.com");
  });

  it("UserService.getUserByToken returns null for invalid token", async () => {
    const userService = app.container.resolve(UserService);
    const user = await userService.getUserByToken("invalid-token");
    expect(user).toBeNull();
  });

  it("UserService.register throws error when email already exists", async () => {
    const userService = app.container.resolve(UserService);
    await userService.register({
      username: "user1",
      email: "duplicate@example.com",
      password: "password123",
    });

    await expect(
      userService.register({
        username: "user2",
        email: "duplicate@example.com",
        password: "differentpass",
      }),
    ).rejects.toThrow("Email already registered");
  });
});
