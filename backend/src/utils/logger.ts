interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 
      ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
      : message;
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message: formattedMessage,
    };

    // In production, you might want to use a proper logging library like Winston
    console.log(JSON.stringify(logEntry));
  }

  error(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LOG_LEVELS.INFO, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env['NODE_ENV'] === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, ...args);
    }
  }
}

export const logger = new Logger();