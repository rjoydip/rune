import { describe, it, expect } from "bun:test";
import type { MailAdapter, MailMessage } from "../src/index";

describe("MailAdapter type", () => {
  it("is a valid interface", () => {
    const adapter: MailAdapter = {
      async send() {},
    };
    expect(adapter).toBeDefined();
    expect(typeof adapter.send).toBe("function");
  });

  it("MailMessage has required fields", () => {
    const msg: MailMessage = {
      to: "user@test.com",
      from: "noreply@test.com",
      subject: "Test",
      text: "Hello",
    };
    expect(msg.to).toBe("user@test.com");
    expect(msg.from).toBe("noreply@test.com");
  });

  it("MailMessage supports html", () => {
    const msg: MailMessage = {
      to: ["user1@test.com", "user2@test.com"],
      from: "noreply@test.com",
      subject: "HTML",
      html: "<h1>Hi</h1>",
      cc: "cc@test.com",
      bcc: "bcc@test.com",
    };
    expect(Array.isArray(msg.to)).toBe(true);
    expect(msg.html).toBe("<h1>Hi</h1>");
  });
});

describe("mock mail adapter", () => {
  function createMockMailer(): MailAdapter & { sentMessages: MailMessage[] } {
    const sentMessages: MailMessage[] = [];
    return {
      sentMessages,
      async send(message: MailMessage) {
        sentMessages.push(message);
      },
    };
  }

  it("send stores the message for assertion", async () => {
    const mailer = createMockMailer();
    await mailer.send({
      to: "a@test.com",
      from: "b@test.com",
      subject: "Test",
      text: "body",
    });
    expect(mailer.sentMessages).toHaveLength(1);
    expect(mailer.sentMessages[0].to).toBe("a@test.com");
  });

  it("MailMessage with attachments", () => {
    const msg: MailMessage = {
      to: "user@test.com",
      from: "noreply@test.com",
      subject: "With attachment",
      text: "See attached",
      attachments: [{ filename: "doc.txt", content: "hello world" }],
    };
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments![0].filename).toBe("doc.txt");
  });

  it("MailMessage with empty optional fields", () => {
    const msg: MailMessage = {
      to: "user@test.com",
      from: "noreply@test.com",
      subject: "Empty optionals",
    };
    expect(msg.html).toBeUndefined();
    expect(msg.cc).toBeUndefined();
    expect(msg.bcc).toBeUndefined();
  });

  it("send with minimal message (only required fields)", async () => {
    const mailer = createMockMailer();
    const msg: MailMessage = {
      to: "minimal@test.com",
      from: "sender@test.com",
      subject: "Minimal",
    };
    await mailer.send(msg);
    expect(mailer.sentMessages[0].subject).toBe("Minimal");
  });
});
