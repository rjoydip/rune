import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("chat-api", () => {
  beforeEach(() => {
    resetState();
  });

  it("creates a room", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "General",
          description: "General discussion room",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe("General");
    expect(data.description).toBe("General discussion room");
  });

  it("gets a room by ID", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Random",
          description: "Random chat room",
        }),
      }),
    );
    const created = await createRes.json();

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/rooms/${created.id}`, {
        headers: { authorization: "Bearer chat-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe("Random");
  });

  it("lists rooms", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "General",
          description: "General chat",
        }),
      }),
    );
    await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Tech",
          description: "Tech talk",
        }),
      }),
    );

    const getRes = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        headers: { authorization: "Bearer chat-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  it("sends a message to a room", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Chat Room",
          description: "A room for chatting",
        }),
      }),
    );
    const room = await createRes.json();

    const msgRes = await app.fetch(
      new Request(`http://localhost/api/v1/rooms/${room.id}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          text: "Hello, world!",
        }),
      }),
    );
    expect(msgRes.status).toBe(201);
    const message = await msgRes.json();
    expect(message.id).toBeDefined();
    expect(message.text).toBe("Hello, world!");
    expect(message.roomId).toBe(room.id);
  });

  it("lists messages in a room", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Test Room",
          description: "For testing messages",
        }),
      }),
    );
    const room = await createRes.json();

    await app.fetch(
      new Request(`http://localhost/api/v1/rooms/${room.id}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({ text: "First message" }),
      }),
    );
    await app.fetch(
      new Request(`http://localhost/api/v1/rooms/${room.id}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({ text: "Second message" }),
      }),
    );

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/rooms/${room.id}/messages`, {
        headers: { authorization: "Bearer chat-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const messages = await getRes.json();
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe("First message");
    expect(messages[1].text).toBe("Second message");
  });

  it("returns 401 for invalid token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          name: "Test",
          description: "Test room",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing auth header", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Test",
          description: "Test room",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when sending message to non-existent room", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/rooms/non-existent-room/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer chat-secret-token-2024",
        },
        body: JSON.stringify({ text: "Hello?" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when getting messages from non-existent room", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/rooms/non-existent-room/messages", {
        headers: { authorization: "Bearer chat-secret-token-2024" },
      }),
    );
    expect(res.status).toBe(404);
  });
});
