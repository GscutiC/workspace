/**
 * Enhanced logging system for districts with performance and environment awareness
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  DISTRICTS = 'DISTRICTS',
  GRAPHQL = 'GRAPHQL',
  PERFORMANCE = 'PERFORMANCE',
  PIXI = 'PIXI',
  GAME_ENGINE = 'GAME_ENGINE',
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stack?: string;
}

class DistrictLogger {
  private static instance: DistrictLogger;
  private logLevel: LogLevel;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;
  private enableConsoleOutput: boolean;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
    this.enableConsoleOutput = process.env.NODE_ENV === 'development' || 
                               typeof window !== 'undefined' && 
                               (window as any).DEBUG_DISTRICTS === true;
  }

  public static getInstance(): DistrictLogger {
    if (!DistrictLogger.instance) {
      DistrictLogger.instance = new DistrictLogger();
    }
    return DistrictLogger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private formatMessage(category: LogCategory, message: string, data?: any): string {
    const categoryEmojis: Record<LogCategory, string> = {
      [LogCategory.DISTRICTS]: '🏛️',
      [LogCategory.GRAPHQL]: '📡',
      [LogCategory.PERFORMANCE]: '⚡',
      [LogCategory.PIXI]: '🎮',
      [LogCategory.GAME_ENGINE]: '🎯',
    };

    const emoji = categoryEmojis[category] || '📋';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${emoji} [${category}] ${message}${dataStr}`;
  }

  public debug(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level: LogLevel.DEBUG,
      category,
      message,
      data,
    };

    this.addToHistory(entry);

    if (this.enableConsoleOutput) {
      console.debug(this.formatMessage(category, message, data));
    }
  }

  public info(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level: LogLevel.INFO,
      category,
      message,
      data,
    };

    this.addToHistory(entry);

    if (this.enableConsoleOutput) {
      console.info(this.formatMessage(category, message, data));
    }
  }

  public warn(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level: LogLevel.WARN,
      category,
      message,
      data,
    };

    this.addToHistory(entry);

    if (this.enableConsoleOutput) {
      console.warn(this.formatMessage(category, message, data));
    }
  }

  public error(category: LogCategory, message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level: LogLevel.ERROR,
      category,
      message,
      data: error,
      stack: error instanceof Error ? error.stack : undefined,
    };

    this.addToHistory(entry);

    if (this.enableConsoleOutput) {
      console.error(this.formatMessage(category, message, error));
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  public getHistory(category?: LogCategory, level?: LogLevel): LogEntry[] {
    return this.logHistory.filter(entry => {
      if (category && entry.category !== category) return false;
      if (level !== undefined && entry.level !== level) return false;
      return true;
    });
  }

  public clearHistory(): void {
    this.logHistory = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Export singleton instance methods
const logger = DistrictLogger.getInstance();

export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

// Utility for performance logging
export const withPerformanceLogging = <T>(
  category: LogCategory,
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> => {
  const start = performance.now();
  logDebug(category, `Starting ${operation}`);

  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then((value) => {
        const duration = performance.now() - start;
        logDebug(LogCategory.PERFORMANCE, `${operation} completed`, { duration: `${duration.toFixed(2)}ms` });
        return value;
      }).catch((error) => {
        const duration = performance.now() - start;
        logError(LogCategory.PERFORMANCE, `${operation} failed`, { duration: `${duration.toFixed(2)}ms`, error });
        throw error;
      });
    } else {
      const duration = performance.now() - start;
      logDebug(LogCategory.PERFORMANCE, `${operation} completed`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    logError(LogCategory.PERFORMANCE, `${operation} failed`, { duration: `${duration.toFixed(2)}ms`, error });
    throw error;
  }
};

export { DistrictLogger };