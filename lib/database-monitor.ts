import { createClient } from '@supabase/supabase-js';
import { performanceMonitor } from './performance-monitor';

// Database performance metrics
export interface DatabaseMetrics {
  timestamp: number;
  query: string;
  duration: number;
  rowsAffected?: number;
  success: boolean;
  error?: string;
  table?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
}

// Database connection pool metrics
export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  waitingClients: number;
  maxConnections: number;
}

// Supabase performance monitor
export class SupabasePerformanceMonitor {
  private static instance: SupabasePerformanceMonitor;
  private metrics: DatabaseMetrics[] = [];
  private maxMetrics = 5000;
  private slowQueryThreshold = 1000; // 1 second

  private constructor() {}

  public static getInstance(): SupabasePerformanceMonitor {
    if (!SupabasePerformanceMonitor.instance) {
      SupabasePerformanceMonitor.instance = new SupabasePerformanceMonitor();
    }
    return SupabasePerformanceMonitor.instance;
  }

  // Record database query metric
  public recordQuery(metric: DatabaseMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metric.duration > this.slowQueryThreshold) {
      console.warn('Slow database query detected:', {
        query: metric.query.substring(0, 100) + '...',
        duration: metric.duration,
        table: metric.table,
        operation: metric.operation,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }

    // Log failed queries
    if (!metric.success) {
      console.error('Database query failed:', {
        query: metric.query.substring(0, 100) + '...',
        error: metric.error,
        table: metric.table,
        operation: metric.operation,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }
  }

  // Get database performance statistics
  public getStats(timeWindow?: number): DatabaseStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= windowStart);
    
    if (relevantMetrics.length === 0) {
      return {
        totalQueries: 0,
        successRate: 0,
        averageQueryTime: 0,
        p95QueryTime: 0,
        p99QueryTime: 0,
        slowQueries: 0,
        queriesPerSecond: 0,
        operationBreakdown: {},
        tableBreakdown: {}
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulQueries = relevantMetrics.filter(m => m.success).length;
    const slowQueries = relevantMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    const timeSpan = (now - relevantMetrics[0].timestamp) / 1000;

    // Operation breakdown
    const operationBreakdown: Record<string, number> = {};
    relevantMetrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1;
    });

    // Table breakdown
    const tableBreakdown: Record<string, number> = {};
    relevantMetrics.forEach(m => {
      if (m.table) {
        tableBreakdown[m.table] = (tableBreakdown[m.table] || 0) + 1;
      }
    });

    return {
      totalQueries: relevantMetrics.length,
      successRate: (successfulQueries / relevantMetrics.length) * 100,
      averageQueryTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95QueryTime: durations[Math.floor(durations.length * 0.95)] || 0,
      p99QueryTime: durations[Math.floor(durations.length * 0.99)] || 0,
      slowQueries,
      queriesPerSecond: timeSpan > 0 ? relevantMetrics.length / timeSpan : 0,
      operationBreakdown,
      tableBreakdown
    };
  }

  // Get metrics for specific table
  public getTableStats(table: string, timeWindow?: number): DatabaseStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const tableMetrics = this.metrics.filter(m => 
      m.table === table && m.timestamp >= windowStart
    );

    if (tableMetrics.length === 0) {
      return {
        totalQueries: 0,
        successRate: 0,
        averageQueryTime: 0,
        p95QueryTime: 0,
        p99QueryTime: 0,
        slowQueries: 0,
        queriesPerSecond: 0,
        operationBreakdown: {},
        tableBreakdown: { [table]: 0 }
      };
    }

    const durations = tableMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulQueries = tableMetrics.filter(m => m.success).length;
    const slowQueries = tableMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    const timeSpan = (now - tableMetrics[0].timestamp) / 1000;

    const operationBreakdown: Record<string, number> = {};
    tableMetrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1;
    });

    return {
      totalQueries: tableMetrics.length,
      successRate: (successfulQueries / tableMetrics.length) * 100,
      averageQueryTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95QueryTime: durations[Math.floor(durations.length * 0.95)] || 0,
      p99QueryTime: durations[Math.floor(durations.length * 0.99)] || 0,
      slowQueries,
      queriesPerSecond: timeSpan > 0 ? tableMetrics.length / timeSpan : 0,
      operationBreakdown,
      tableBreakdown: { [table]: tableMetrics.length }
    };
  }

  // Export metrics for analysis
  public exportMetrics(): DatabaseMetrics[] {
    return [...this.metrics];
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Database statistics interface
export interface DatabaseStats {
  totalQueries: number;
  successRate: number;
  averageQueryTime: number;
  p95QueryTime: number;
  p99QueryTime: number;
  slowQueries: number;
  queriesPerSecond: number;
  operationBreakdown: Record<string, number>;
  tableBreakdown: Record<string, number>;
}

// Enhanced Supabase client with monitoring
export function createMonitoredSupabaseClient(url: string, key: string) {
  const client = createClient(url, key);
  const monitor = SupabasePerformanceMonitor.getInstance();

  // Wrap the client methods to add monitoring
  const originalFrom = client.from.bind(client);
  
  client.from = function(table: string) {
    const queryBuilder = originalFrom(table);
    
    // Wrap query methods
    const wrapMethod = (method: string, originalMethod: any) => {
      return function(this: any, ...args: any[]) {
        const startTime = Date.now();
        const result = originalMethod.apply(this, args);
        
        // If it's a promise, monitor it
        if (result && typeof result.then === 'function') {
          return result
            .then((response: any) => {
              const duration = Date.now() - startTime;
              
              monitor.recordQuery({
                timestamp: startTime,
                query: `${method.toUpperCase()} from ${table}`,
                duration,
                rowsAffected: response.data?.length,
                success: !response.error,
                error: response.error?.message,
                table,
                operation: method.toUpperCase() as any
              });
              
              return response;
            })
            .catch((error: any) => {
              const duration = Date.now() - startTime;
              
              monitor.recordQuery({
                timestamp: startTime,
                query: `${method.toUpperCase()} from ${table}`,
                duration,
                success: false,
                error: error.message,
                table,
                operation: method.toUpperCase() as any
              });
              
              throw error;
            });
        }
        
        return result;
      };
    };

    // Wrap common query methods
    ['select', 'insert', 'update', 'delete', 'upsert'].forEach(method => {
      const methodKey = method as keyof typeof queryBuilder;
      if (queryBuilder[methodKey] && typeof queryBuilder[methodKey] === 'function') {
        (queryBuilder as any)[methodKey] = wrapMethod(method, (queryBuilder[methodKey] as any).bind(queryBuilder));
      }
    });

    return queryBuilder;
  };

  return client;
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Simple health check query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message
      };
    }

    return {
      healthy: true,
      latency
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Query optimization suggestions
export function analyzeQueryPerformance(metrics: DatabaseMetrics[]): {
  suggestions: string[];
  criticalIssues: string[];
} {
  const suggestions: string[] = [];
  const criticalIssues: string[] = [];

  // Analyze slow queries
  const slowQueries = metrics.filter(m => m.duration > 1000);
  if (slowQueries.length > 0) {
    const slowQueryRate = (slowQueries.length / metrics.length) * 100;
    if (slowQueryRate > 10) {
      criticalIssues.push(`${slowQueryRate.toFixed(1)}% of queries are slow (>1s)`);
    } else if (slowQueryRate > 5) {
      suggestions.push(`${slowQueryRate.toFixed(1)}% of queries are slow - consider optimization`);
    }
  }

  // Analyze error rate
  const failedQueries = metrics.filter(m => !m.success);
  if (failedQueries.length > 0) {
    const errorRate = (failedQueries.length / metrics.length) * 100;
    if (errorRate > 5) {
      criticalIssues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    } else if (errorRate > 1) {
      suggestions.push(`Error rate: ${errorRate.toFixed(1)}% - investigate failed queries`);
    }
  }

  // Analyze query patterns
  const operationCounts: Record<string, number> = {};
  metrics.forEach(m => {
    operationCounts[m.operation] = (operationCounts[m.operation] || 0) + 1;
  });

  const selectRatio = (operationCounts.SELECT || 0) / metrics.length;
  if (selectRatio < 0.7) {
    suggestions.push('High write-to-read ratio detected - consider read replicas');
  }

  // Analyze table access patterns
  const tableCounts: Record<string, number> = {};
  metrics.forEach(m => {
    if (m.table) {
      tableCounts[m.table] = (tableCounts[m.table] || 0) + 1;
    }
  });

  const hotTables = Object.entries(tableCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (hotTables.length > 0) {
    suggestions.push(`Most accessed tables: ${hotTables.map(([table, count]) => `${table} (${count})`).join(', ')}`);
  }

  return { suggestions, criticalIssues };
}

// Export singleton instance
export const databaseMonitor = SupabasePerformanceMonitor.getInstance();
