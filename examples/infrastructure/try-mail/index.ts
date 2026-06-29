import type { MailAdapter, MailMessage } from "@rune/mail";

class ConsoleMailAdapter implements MailAdapter {
  async send(message: MailMessage): Promise<void> {
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body: ${message.text || message.html}`);
  }
}

const mailer = new ConsoleMailAdapter();
await mailer.send({
  to: "user@example.com",
  from: "admin@example.com",
  subject: "Welcome",
  text: "Hello from Rune!",
});
