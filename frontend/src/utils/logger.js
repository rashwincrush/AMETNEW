// Centralized logger with redaction and prod no-op
// In production, all methods are no-ops to ensure zero console output

const PATTERNS = [
  /(sb_(publishable|secret)_[A-Za-z0-9_-]+)/gi, // Supabase keys
  /(Bearer\s+[A-Za-z0-9-_.]+)/gi,              // Authorization headers
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, // UUIDs
  /[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,            // Emails
];

const redact = (x) => {
  if (typeof x === 'string') {
    return PATTERNS.reduce((s, r) => s.replace(r, '[REDACTED]'), x);
  }
  try {
    return JSON.parse(
      PATTERNS.reduce(
        (s, r) => s.replace(r, '[REDACTED]'),
        JSON.stringify(x, (_k, v) => (typeof v === 'string' ? v : v))
      )
    );
  } catch {
    return x;
  }
};

const MODE = process.env.NODE_ENV || 'development';
const isProd = MODE === 'production';

const logger = {
  error: (...a) => { if (!isProd) console.error(...a.map(redact)); },
  warn:  (...a) => { if (!isProd) console.warn(...a.map(redact)); },
  info:  (...a) => { if (!isProd) console.info(...a.map(redact)); },
  debug: () => {},
};

export default logger;
