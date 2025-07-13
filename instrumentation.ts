export async function register() {
  // Only initialize server-side Sentry to avoid edge runtime issues
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await import('./sentry.server.config');
    } catch (error) {
      console.warn('Failed to load Sentry server config:', error);
    }
  }

  // Temporarily disable edge runtime to fix ENOENT error
  // Edge runtime will be handled by client-side Sentry initialization
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('Edge runtime detected - Sentry will be initialized client-side');
  }
}

export async function onRequestError(err: unknown, request: Request, context: any) {
  try {
    const { captureException } = await import('@sentry/nextjs');
    captureException(err, {
      contexts: {
        request: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
        },
        context,
      },
    });
  } catch (error) {
    console.error('Failed to capture exception with Sentry:', error);
  }
}
