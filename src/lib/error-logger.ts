import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ErrorLogEntry {
  id?: string;
  error_type: 'api_error' | 'ai_error' | 'database_error' | 'notion_error' | 'validation_error' | 'auth_error';
  error_message: string;
  error_stack?: string;
  endpoint: string;
  user_id?: string;
  team_id?: string;
  request_data?: Record<string, any>;
  response_status: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PipelineStepLog {
  step_name: string;
  status: 'started' | 'completed' | 'failed';
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced error logger with structured logging and database persistence
 */
export class ErrorLogger {
  /**
   * Log an error with full context
   */
  static async logError(
    errorType: ErrorLogEntry['error_type'],
    error: Error | string,
    context: {
      endpoint: string;
      userId?: string;
      teamId?: string;
      requestData?: Record<string, any>;
      responseStatus: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry: ErrorLogEntry = {
      error_type: errorType,
      error_message: errorMessage,
      error_stack: errorStack,
      endpoint: context.endpoint,
      user_id: context.userId,
      team_id: context.teamId,
      request_data: context.requestData,
      response_status: context.responseStatus,
      timestamp: new Date().toISOString(),
      metadata: context.metadata
    };

    // Console logging with structured format
    console.error('🚨 ERROR LOGGED:', {
      type: errorType,
      endpoint: context.endpoint,
      status: context.responseStatus,
      message: errorMessage,
      userId: context.userId,
      timestamp: logEntry.timestamp,
      metadata: context.metadata
    });

    // Log stack trace in development
    if (process.env.NODE_ENV === 'development' && errorStack) {
      console.error('Stack trace:', errorStack);
    }

    // Store in database (non-blocking)
    try {
      await supabase
        .from('error_logs')
        .insert(logEntry);
    } catch (dbError) {
      console.error('Failed to store error log in database:', dbError);
    }
  }

  /**
   * Log pipeline step execution
   */
  static async logPipelineStep(
    summaryId: string,
    step: PipelineStepLog
  ): Promise<void> {
    const logEntry = {
      summary_id: summaryId,
      step_name: step.step_name,
      status: step.status,
      duration_ms: step.duration_ms,
      error_message: step.error_message,
      metadata: step.metadata,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 PIPELINE STEP [${summaryId}]:`, {
      step: step.step_name,
      status: step.status,
      duration: step.duration_ms ? `${step.duration_ms}ms` : 'N/A',
      error: step.error_message || 'None'
    });

    // Store pipeline step log (non-blocking)
    try {
      await supabase
        .from('pipeline_logs')
        .insert(logEntry);
    } catch (dbError) {
      console.error('Failed to store pipeline log:', dbError);
    }
  }

  /**
   * Update summary status with error information
   */
  static async updateSummaryStatus(
    summaryId: string,
    status: 'pending' | 'success' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        notion_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'failed' && errorMessage) {
        updateData.error_message = errorMessage;
        updateData.error_timestamp = new Date().toISOString();
      }

      await supabase
        .from('summaries')
        .update(updateData)
        .eq('id', summaryId);

      console.log(`📝 SUMMARY STATUS UPDATED [${summaryId}]:`, {
        status,
        error: errorMessage || 'None'
      });

    } catch (error) {
      console.error('Failed to update summary status:', error);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  static async getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total: number;
    byType: Record<string, number>;
    byEndpoint: Record<string, number>;
    recentErrors: ErrorLogEntry[];
  }> {
    try {
      const timeAgo = new Date();
      switch (timeframe) {
        case 'hour':
          timeAgo.setHours(timeAgo.getHours() - 1);
          break;
        case 'day':
          timeAgo.setDate(timeAgo.getDate() - 1);
          break;
        case 'week':
          timeAgo.setDate(timeAgo.getDate() - 7);
          break;
      }

      const { data: errors, error } = await supabase
        .from('error_logs')
        .select('*')
        .gte('timestamp', timeAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error || !errors) {
        throw new Error('Failed to fetch error stats');
      }

      const byType: Record<string, number> = {};
      const byEndpoint: Record<string, number> = {};

      errors.forEach(err => {
        byType[err.error_type] = (byType[err.error_type] || 0) + 1;
        byEndpoint[err.endpoint] = (byEndpoint[err.endpoint] || 0) + 1;
      });

      return {
        total: errors.length,
        byType,
        byEndpoint,
        recentErrors: errors.slice(0, 10)
      };

    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        total: 0,
        byType: {},
        byEndpoint: {},
        recentErrors: []
      };
    }
  }
}

/**
 * Middleware wrapper for API routes with automatic error logging
 */
export function withErrorLogging(
  handler: (req: any, res: any) => Promise<void>,
  endpoint: string
) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    
    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await ErrorLogger.logError(
        'api_error',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          endpoint,
          userId: req.body?.userId || req.headers['x-user-id'],
          teamId: req.body?.teamId || req.headers['x-team-id'],
          requestData: {
            method: req.method,
            body: req.body,
            query: req.query,
            headers: {
              'user-agent': req.headers['user-agent'],
              'content-type': req.headers['content-type']
            }
          },
          responseStatus: 500,
          metadata: {
            duration_ms: duration,
            timestamp: new Date().toISOString()
          }
        }
      );

      // Send error response
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      });
    }
  };
}

/**
 * Performance monitoring for pipeline steps
 */
export class PipelineMonitor {
  private summaryId: string;
  private steps: Map<string, { startTime: number; metadata?: any }> = new Map();

  constructor(summaryId: string) {
    this.summaryId = summaryId;
  }

  async startStep(stepName: string, metadata?: any): Promise<void> {
    this.steps.set(stepName, { startTime: Date.now(), metadata });
    
    await ErrorLogger.logPipelineStep(this.summaryId, {
      step_name: stepName,
      status: 'started',
      metadata
    });
  }

  async completeStep(stepName: string, metadata?: any): Promise<void> {
    const step = this.steps.get(stepName);
    if (!step) {
      console.warn(`Step ${stepName} was not started`);
      return;
    }

    const duration = Date.now() - step.startTime;
    
    await ErrorLogger.logPipelineStep(this.summaryId, {
      step_name: stepName,
      status: 'completed',
      duration_ms: duration,
      metadata: { ...step.metadata, ...metadata }
    });

    this.steps.delete(stepName);
  }

  async failStep(stepName: string, error: string, metadata?: any): Promise<void> {
    const step = this.steps.get(stepName);
    const duration = step ? Date.now() - step.startTime : undefined;
    
    await ErrorLogger.logPipelineStep(this.summaryId, {
      step_name: stepName,
      status: 'failed',
      duration_ms: duration,
      error_message: error,
      metadata: { ...step?.metadata, ...metadata }
    });

    this.steps.delete(stepName);
  }
}
