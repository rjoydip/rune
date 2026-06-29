import { describe, it, expect } from "bun:test";
import type { MailAdapter, MailMessage } from "@rune/mail";

describe("try-mail", () => {
  it("sends a message via mock adapter", async () => {
    const sent: MailMessage[] = [];
    const mailer: MailAdapter = {
      async send(msg: MailMessage) {
        sent.push(msg);
      },
    };
    await mailer.send({ to: "a@b.com", from: "sender@b.com", subject: "Test", text: "body" });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("a@b.com");
  });

  it("supports html messages", async () => {
    const mailer: MailAdapter = {
      async send() {},
    };
    await expect(
      mailer.send({
        to: "a@b.com",
        from: "sender@b.com",
        subject: "HTML",
        html: "<h1>Hi</h1>",
      }),
    ).resolves.toBeUndefined();
  });
});
