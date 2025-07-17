import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBaseUrl } from '@/lib/getBaseUrl';

export async function GET() {
  const startTime = Date.now();
  const healthData: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    services: {},
    metrics: {}
  };

  try {
    // Test Supabase connection
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        healthData.services.database = 'unhealthy';
        healthData.services.database_error = error.message;
      } else {
        healthData.services.database = 'healthy';
      }
    } catch (error) {
      healthData.services.database = 'unhealthy';
      healthData.services.database_error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test OpenRouter AI connection
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': getBaseUrl(),
          'X-Title': 'Slack Summary Scribe'
        }
      });

      if (response.ok) {
        healthData.services.ai = 'healthy';
      } else {
        healthData.services.ai = 'unhealthy';
        healthData.services.ai_error = `HTTP ${response.status}`;
      }
    } catch (error) {
      healthData.services.ai = 'unhealthy';
      healthData.services.ai_error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test external services
    healthData.services.slack = process.env.SLACK_CLIENT_ID ? 'configured' : 'not_configured';
    healthData.services.sentry = process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not_configured';
    healthData.services.resend = process.env.RESEND_API_KEY ? 'configured' : 'not_configured';

    // Calculate response time
    const responseTime = Date.now() - startTime;
    healthData.metrics.response_time_ms = responseTime;
    healthData.metrics.memory_usage = process.memoryUsage();

    // Determine overall status
    const criticalServices = ['database', 'ai'];
    const unhealthyServices = criticalServices.filter(service => 
      healthData.services[service] === 'unhealthy'
    );

    if (unhealthyServices.length > 0) {
      healthData.status = 'unhealthy';
      healthData.unhealthy_services = unhealthyServices;
      
      return NextResponse.json(healthData, { status: 503 });
    }

    // Performance warnings
    if (responseTime > 5000) {
      healthData.status = 'degraded';
      healthData.warning = 'High response time';
    }

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        response_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
