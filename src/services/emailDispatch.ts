/**
 * Email dispatch helper for 1-click email composing across clients without OAuth.
 */

export interface EmailDispatchOptions {
  to?: string;
  subject: string;
  body: string;
}

/**
 * Builds a Gmail web compose URL.
 * Opens directly in Gmail Web in a new tab with recipient, subject, and body pre-filled.
 */
export function buildGmailWebUrl(options: EmailDispatchOptions): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: options.to || '',
    su: options.subject || '',
    body: options.body || '',
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Builds an Outlook Web compose URL.
 * Opens directly in Outlook 365 / live.com webmail with pre-filled fields.
 */
export function buildOutlookWebMailUrl(options: EmailDispatchOptions): string {
  const params = new URLSearchParams({
    to: options.to || '',
    subject: options.subject || '',
    body: options.body || '',
  });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/**
 * Builds a standard mailto: link for default native desktop/mobile mail clients
 * (Apple Mail, Thunderbird, Windows Mail, etc.).
 */
export function buildMailtoUrl(options: EmailDispatchOptions): string {
  const queryParts: string[] = [];
  if (options.subject) {
    queryParts.push(`subject=${encodeURIComponent(options.subject)}`);
  }
  if (options.body) {
    queryParts.push(`body=${encodeURIComponent(options.body)}`);
  }
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const recipient = options.to ? encodeURIComponent(options.to) : '';
  return `mailto:${recipient}${query}`;
}
