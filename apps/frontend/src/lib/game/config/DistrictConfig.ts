/**
 * Centralized configuration for District System
 * Provides environment-aware settings and validation
 */

export interface DistrictConfig {
  // Visual settings
  defaultOpacity: number;
  hoverOpacity: number;
  selectedOpacity: number;
  borderWidth: number;
  borderAlpha: number;
  
  // Performance settings
  updateThreshold: number; // Minimum movement before district check
  maxDistrictsToRender: number;
  enableCulling: boolean;
  
  // Debug settings
  enableLogging: boolean;
  enablePerformanceMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // API settings
  cacheTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const DISTRICT_CONFIG: DistrictConfig = {
  // Visual settings
  defaultOpacity: 0.2,
  hoverOpacity: 0.7,
  selectedOpacity: 0.8,
  borderWidth: 2,
  borderAlpha: 0.8,
  
  // Performance settings
  updateThreshold: 16, // Half tile movement
  maxDistrictsToRender: 50,
  enableCulling: true,
  
  // Debug settings
  enableLogging: process.env.NODE_ENV === 'development',
  enablePerformanceMetrics: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  
  // API settings
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Validation utilities for district data
 */
export class DistrictValidator {
  static validateBounds(bounds: any): boolean {
    return bounds && 
           typeof bounds.x1 === 'number' &&
           typeof bounds.y1 === 'number' &&
           typeof bounds.x2 === 'number' &&
           typeof bounds.y2 === 'number' &&
           bounds.x2 > bounds.x1 &&
           bounds.y2 > bounds.y1;
  }

  static validateDistrict(district: any): boolean {
    return district &&
           typeof district.id === 'string' &&
           typeof district.name === 'string' &&
           typeof district.zoneCode === 'string' &&
           this.validateBounds(district.bounds);
  }

  static sanitizeDistricts(districts: any[]): any[] {
    if (!Array.isArray(districts)) {
      return [];
    }

    return districts.filter(district => this.validateDistrict(district));
  }
}

/**
 * Performance monitoring for district operations
 */
export class DistrictPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startMeasure(operation: string): () => void {
    if (!DISTRICT_CONFIG.enablePerformanceMetrics) {
      return () => {};
    }

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(duration);

    // Keep only last 100 measurements
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
  }

  static getMetrics(operation: string): { avg: number; max: number; min: number } | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }

    return {
      avg: operationMetrics.reduce((sum, val) => sum + val, 0) / operationMetrics.length,
      max: Math.max(...operationMetrics),
      min: Math.min(...operationMetrics),
    };
  }

  static logMetrics(): void {
    if (!DISTRICT_CONFIG.enablePerformanceMetrics) {
      return;
    }

    // District Performance Metrics (disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 District Performance Metrics');
      this.metrics.forEach((_, operation) => {
        const metrics = this.getMetrics(operation);
        if (metrics) {
          console.log(`${operation}: avg ${metrics.avg.toFixed(2)}ms, max ${metrics.max.toFixed(2)}ms`);
        }
      });
      console.groupEnd();
    }
  }
}