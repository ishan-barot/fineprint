// order matters: labeled account numbers first, then phones, then leftover long digit runs
const ACCOUNT = /\b(account|acct|customer)(?:\s*(?:no\.?|number|#))?\s*[:#]?\s*([A-Z0-9][\d -]{3,}\d|(?=[A-Z-]*\d)[A-Z0-9-]{5,})/gi;
const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const POSTAL = /\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/gi;
const LONG_DIGITS = /\b\d{7,}\b/g;

// runs on the device before any text leaves it, and again on the server just in case
export function redact(text: string): string {
  return text
    .replace(ACCOUNT, (_m, label: string) => `${label} [ACCOUNT]`)
    .replace(EMAIL, "[EMAIL]")
    .replace(PHONE, "[PHONE]")
    .replace(POSTAL, "[POSTAL]")
    .replace(LONG_DIGITS, "[NUMBER]");
}