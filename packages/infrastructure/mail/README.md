# @rune/mail

Email sending abstraction. Defines a message format and sending interface. No default implementation — users provide their own adapter.

## Exports

| Name          | Kind      |
| ------------- | --------- |
| `MailAdapter` | Interface |
| `MailMessage` | Interface |

## Usage

```ts
import type { MailAdapter, MailMessage } from "@rune/mail";

class SmtpMailAdapter implements MailAdapter {
  async send(message: MailMessage) {
    // send via SMTP
  }
}
```

## API

### MailMessage

| Field          | Type                 | Description      |
| -------------- | -------------------- | ---------------- |
| `to`           | `string \| string[]` | Recipient(s)     |
| `from`         | `string`             | Sender address   |
| `subject`      | `string`             | Email subject    |
| `text?`        | `string`             | Plain text body  |
| `html?`        | `string`             | HTML body        |
| `cc?`          | `string \| string[]` | CC recipient(s)  |
| `bcc?`         | `string \| string[]` | BCC recipient(s) |
| `attachments?` | `Array`              | File attachments |

### MailAdapter

| Method          | Description    |
| --------------- | -------------- |
| `send(message)` | Sends an email |

## Dependencies

None.
