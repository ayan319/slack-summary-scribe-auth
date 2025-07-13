import { NextRequest, NextResponse } from 'next/server';
import { sendDeploymentNotifications, DeploymentStatus, DeploymentData } from '@/lib/deployment-notifications';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (Vercel, GitHub Actions, etc.)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.DEPLOYMENT_WEBHOOK_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the deployment data
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.status || !body.environment || !body.branch || !body.commit) {
      return NextResponse.json(
        { success: false, error: 'Missing required deployment data' },
        { status: 400 }
      );
    }

    // Create deployment data object
    const deploymentData: DeploymentData = {
      id: body.id,
      status: body.status as DeploymentStatus,
      environment: body.environment,
      branch: body.branch,
      commit: {
        sha: body.commit.sha,
        message: body.commit.message,
        author: body.commit.author,
        url: body.commit.url
      },
      url: body.url,
      startTime: new Date(body.startTime || Date.now()),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      duration: body.duration,
      buildLogs: body.buildLogs,
      error: body.error
    };

    console.log('Processing deployment notification:', {
      id: deploymentData.id,
      status: deploymentData.status,
      environment: deploymentData.environment,
      branch: deploymentData.branch
    });

    // Send notifications
    const result = await sendDeploymentNotifications(deploymentData);

    // Log the results
    console.log('Deployment notification results:', {
      success: result.success,
      slack: result.results.slack.success,
      discord: result.results.discord.success,
      email: result.results.email.success
    });

    return NextResponse.json({
      success: result.success,
      message: 'Deployment notifications processed',
      results: result.results
    });

  } catch (error) {
    console.error('Error processing deployment notification:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Deployment notification webhook is active',
    requiredFields: [
      'id',
      'status',
      'environment', 
      'branch',
      'commit.sha',
      'commit.message',
      'commit.author'
    ],
    optionalFields: [
      'url',
      'startTime',
      'endTime',
      'duration',
      'buildLogs',
      'error',
      'commit.url'
    ]
  });
}
