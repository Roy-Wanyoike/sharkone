type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const COLOR_CODES: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

const isDev = process.env.NODE_ENV !== 'production';

class Logger {
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  child(additionalContext: Record<string, unknown>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  private log(level: LogLevel, message: string, extra: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...extra,
    };

    if (isDev) {
      const color = COLOR_CODES[level];
      const levelStr = `${color}[${level.toUpperCase()}]${RESET}`;
      // eslint-disable-next-line no-console
      console.log(`${levelStr} ${message}`, { ...this.context, ...extra });
    } else {
      // JSON lines in production
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    this.log('debug', message, extra);
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.log('info', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.log('warn', message, extra);
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.log('error', message, extra);
  }
}

const logger = new Logger();

export default logger;
