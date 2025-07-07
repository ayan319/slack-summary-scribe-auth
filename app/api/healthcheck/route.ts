import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Environment variables check
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      deepseekApiKey: !!process.env.DEEPSEEK_API_KEY,
      sentryDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      jwtSecret: !!process.env.JWT_SECRET,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    // Database connectivity check
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Simple health check query
        const { data, error } = await supabase
          .from('summaries')
          .select('count')
          .limit(1);
          
        if (error) {
          dbStatus = 'error';
          dbError = error.message;
        } else {
          dbStatus = 'connected';
        }
      } else {
        dbStatus = 'not_configured';
      }
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }

    // AI service check
    let aiStatus = 'unknown';
    if (process.env.DEEPSEEK_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
        aiStatus = 'placeholder';
      } else {
        aiStatus = 'configured';
      }
    } else {
      aiStatus = 'not_configured';
    }

    const responseTime = Date.now() - startTime;
    const allEnvVarsPresent = Object.values(envCheck).every(Boolean);
    const isHealthy = dbStatus === 'connected' && aiStatus === 'configured' && allEnvVarsPresent;

    return NextResponse.json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      checks: {
        environment: {
          status: allEnvVarsPresent ? 'ok' : 'error',
          details: envCheck,
        },
        database: {
          status: dbStatus,
          error: dbError,
        },
        ai_service: {
          status: aiStatus,
        },
        sentry: {
          status: envCheck.sentryDsn ? 'configured' : 'not_configured',
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
