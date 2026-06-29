/**
 * Represents an email message to be sent via the mail adapter.
 *
 * @example
 * ```ts
 * const msg: MailMessage = {
 *   to: "user@example.com",
 *   from: "no-reply@example.com",
 *   subject: "Welcome!",
 *   text: "Thank you for signing up.",
 * };
 * ```
 */
export interface MailMessage {
  /** The recipient email address(es). */
  to: string | string[];
  /** The sender email address. */
  from: string;
  /** The subject line of the email. */
  subject: string;
  /** Plain text body content. */
  text?: string;
  /** HTML body content. */
  html?: string;
  /** Carbon-copy recipient(s). */
  cc?: string | string[];
  /** Blind carbon-copy recipient(s). */
  bcc?: string | string[];
  /** File attachments included in the message. */
  attachments?: Array<{ filename: string; content: Uint8Array | string }>;
}

/**
 * Mail sending adapter interface.
 * Provides a generic contract for delivering email messages.
 */
export interface MailAdapter {
  /**
   * Send an email message.
   * @param message - The message to send.
   *
   * @example
   * ```ts
   * await mailer.send({ to: "user@test.com", from: "admin@test.com", subject: "Hi", text: "Hello" });
   * ```
   */
  send(message: MailMessage): Promise<void>;
}
