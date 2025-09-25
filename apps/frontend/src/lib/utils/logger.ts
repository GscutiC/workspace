/**
 * Conditional logging system for development/production environments
 * Provides controlled logging with different levels and categories
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export enum LogCategory {
  GENERAL = 'general',
  VIEWPORT = 'viewport',
  MINIMAP = 'minimap',
  DISTRICTS = 'districts',
  GRAPHQL = 'graphql',
  GAME_ENGINE = 'game_engine',
  AVATAR = 'avatar',
  MOVEMENT = 'movement',
}

class Logger {
  private isDevelopment: boolean;
  private enabledCategories: Set<LogCategory>;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // Make logging much less verbose - only errors and critical warnings
    this.logLevel = LogLevel.ERROR;
    this.enabledCategories = new Set([
      // Only critical categories even in development
      LogCategory.GENERAL,
      LogCategory.GRAPHQL,
      // Remove noisy categories
      ...(this.isDevelopment ? [LogCategory.GAME_ENGINE] : [])
    ] as LogCategory[]);
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    return (
      level <= this.logLevel &&
      (this.enabledCategories.has(category) || level <= LogLevel.WARN)
    );
  }

  private formatMessage(category: LogCategory, message: string, data?: any): [string, ...any[]] {
    const timestamp = new Date().toISOString().slice(11, 23);
    const categoryEmoji = this.getCategoryEmoji(category);
    const prefix = `${categoryEmoji} [${timestamp}] ${category.toUpperCase()}`;

    if (data !== undefined) {
      return [`${prefix}: ${message}`, data];
    }
    return [`${prefix}: ${message}`];
  }

  private getCategoryEmoji(category: LogCategory): string {
    const emojis: Record<LogCategory, string> = {
      [LogCategory.GENERAL]: '🔵',
      [LogCategory.VIEWPORT]: '📷',
      [LogCategory.MINIMAP]: '🗺️',
      [LogCategory.DISTRICTS]: '🏘️',
      [LogCategory.GRAPHQL]: '🔄',
      [LogCategory.GAME_ENGINE]: '🎮',
      [LogCategory.AVATAR]: '👤',
      [LogCategory.MOVEMENT]: '🚶',
    };
    return emojis[category] || '📝';
  }

  public error(category: LogCategory, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      const args = this.formatMessage(category, message, data);
      console.error(...args);
    }
  }

  public warn(category: LogCategory, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      const args = this.formatMessage(category, message, data);
      console.warn(...args);
    }
  }

  public info(category: LogCategory, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      const args = this.formatMessage(category, message, data);
      console.log(...args);
    }
  }

  public debug(category: LogCategory, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      const args = this.formatMessage(category, message, data);
      console.log(...args);
    }
  }

  // Critical logs that should always show
  public critical(category: LogCategory, message: string, data?: any): void {
    const args = this.formatMessage(category, message, data);
    console.error(...args);
  }

  // Enable/disable specific categories
  public enableCategory(category: LogCategory): void {
    this.enabledCategories.add(category);
  }

  public disableCategory(category: LogCategory): void {
    this.enabledCategories.delete(category);
  }

  // Set log level
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Development mode helpers
  public enableDevelopmentMode(): void {
    this.isDevelopment = true;
    this.setLogLevel(LogLevel.DEBUG);
    this.enabledCategories.add(LogCategory.GENERAL);
    this.enabledCategories.add(LogCategory.GAME_ENGINE);
  }

  public enableProductionMode(): void {
    this.isDevelopment = false;
    this.setLogLevel(LogLevel.ERROR);
    this.enabledCategories.clear();
    this.enabledCategories.add(LogCategory.GENERAL);
    this.enabledCategories.add(LogCategory.GRAPHQL);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports for common usage
export const logError = (category: LogCategory, message: string, data?: any) =>
  logger.error(category, message, data);

export const logWarn = (category: LogCategory, message: string, data?: any) =>
  logger.warn(category, message, data);

export const logInfo = (category: LogCategory, message: string, data?: any) =>
  logger.info(category, message, data);

export const logDebug = (category: LogCategory, message: string, data?: any) =>
  logger.debug(category, message, data);

export const logCritical = (category: LogCategory, message: string, data?: any) =>
  logger.critical(category, message, data);