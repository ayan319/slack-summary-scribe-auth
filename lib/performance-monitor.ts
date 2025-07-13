import { performance } from 'perf_hooks';

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  endpoint?: string;
  userId?: string;
  organizationId?: string;
  success: boolean;
  error?: string;
}

// Performance monitor class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics in memory

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  public startTimer(label: string): PerformanceTimer {
    return new PerformanceTimer(label, this);
  }

  // Record a metric
  public recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 5000) { // 5 seconds
      console.warn('Slow operation detected:', {
        endpoint: metric.endpoint,
        duration: metric.duration,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }

    // Log high memory usage
    if (metric.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('High memory usage detected:', {
        endpoint: metric.endpoint,
        heapUsed: Math.round(metric.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }
  }

  // Get performance statistics
  public getStats(timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= windowStart);
    
    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        errorRate: 0,
        requestsPerSecond: 0
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const memoryUsages = relevantMetrics.map(m => m.memoryUsage.heapUsed);
    const successfulRequests = relevantMetrics.filter(m => m.success).length;
    const timeSpan = (now - relevantMetrics[0].timestamp) / 1000; // seconds

    return {
      totalRequests: relevantMetrics.length,
      successRate: (successfulRequests / relevantMetrics.length) * 100,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      errorRate: ((relevantMetrics.length - successfulRequests) / relevantMetrics.length) * 100,
      requestsPerSecond: timeSpan > 0 ? relevantMetrics.length / timeSpan : 0
    };
  }

  // Get metrics by endpoint
  public getEndpointStats(endpoint: string, timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const endpointMetrics = this.metrics.filter(m => 
      m.endpoint === endpoint && m.timestamp >= windowStart
    );

    if (endpointMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        errorRate: 0,
        requestsPerSecond: 0
      };
    }

    const durations = endpointMetrics.map(m => m.duration).sort((a, b) => a - b);
    const memoryUsages = endpointMetrics.map(m => m.memoryUsage.heapUsed);
    const successfulRequests = endpointMetrics.filter(m => m.success).length;
    const timeSpan = (now - endpointMetrics[0].timestamp) / 1000;

    return {
      totalRequests: endpointMetrics.length,
      successRate: (successfulRequests / endpointMetrics.length) * 100,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      errorRate: ((endpointMetrics.length - successfulRequests) / endpointMetrics.length) * 100,
      requestsPerSecond: timeSpan > 0 ? endpointMetrics.length / timeSpan : 0
    };
  }

  // Clear old metrics
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics for analysis
  public exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Performance timer class
export class PerformanceTimer {
  private startTime: number;
  private startCpuUsage?: NodeJS.CpuUsage;
  private label: string;
  private monitor: PerformanceMonitor;

  constructor(label: string, monitor: PerformanceMonitor) {
    this.label = label;
    this.monitor = monitor;
    this.startTime = performance.now();
    
    if (process.cpuUsage) {
      this.startCpuUsage = process.cpuUsage();
    }
  }

  // End timing and record metric
  public end(options?: {
    endpoint?: string;
    userId?: string;
    organizationId?: string;
    success?: boolean;
    error?: string;
  }): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    let cpuUsage: NodeJS.CpuUsage | undefined;
    if (this.startCpuUsage && process.cpuUsage) {
      cpuUsage = process.cpuUsage(this.startCpuUsage);
    }

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      duration,
      memoryUsage,
      cpuUsage,
      endpoint: options?.endpoint || this.label,
      userId: options?.userId,
      organizationId: options?.organizationId,
      success: options?.success ?? true,
      error: options?.error
    };

    this.monitor.recordMetric(metric);
    return metric;
  }
}

// Performance statistics interface
export interface PerformanceStats {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  errorRate: number;
  requestsPerSecond: number;
}

// Middleware for automatic performance monitoring
export function performanceMiddleware(endpoint: string) {
  return (req: any, res: any, next: any) => {
    const monitor = PerformanceMonitor.getInstance();
    const timer = monitor.startTimer(endpoint);
    
    // Store timer in request for later use
    req.performanceTimer = timer;
    req.performanceEndpoint = endpoint;
    
    // Override res.end to capture completion
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      timer.end({
        endpoint,
        success,
        error: success ? undefined : `HTTP ${res.statusCode}`
      });
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// Utility functions
export const performanceUtils = {
  // Monitor a function execution
  async monitor<T>(
    label: string,
    fn: () => Promise<T>,
    options?: {
      endpoint?: string;
      userId?: string;
      organizationId?: string;
    }
  ): Promise<T> {
    const monitor = PerformanceMonitor.getInstance();
    const timer = monitor.startTimer(label);
    
    try {
      const result = await fn();
      timer.end({
        ...options,
        success: true
      });
      return result;
    } catch (error) {
      timer.end({
        ...options,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  // Get current system metrics
  getSystemMetrics(): {
    memory: NodeJS.MemoryUsage;
    cpu?: NodeJS.CpuUsage;
    uptime: number;
  } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage ? process.cpuUsage() : undefined,
      uptime: process.uptime()
    };
  },

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Format duration to human readable
  formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000 * 100) / 100}s`;
    return `${Math.round(ms / 60000 * 100) / 100}m`;
  }
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
