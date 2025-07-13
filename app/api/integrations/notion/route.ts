import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  exportSummaryToNotionPage, 
  exportSummaryToNotionDatabase,
  validateNotionConnection,
  listNotionDatabases,
  getNotionWorkspaceInfo
} from '@/lib/notion-export';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email!;
    const userName = session.user.user_metadata?.name || session.user.email!;

    // Parse request body
    const body = await request.json();
    const { action, summaryData, options } = body;

    console.log('Processing Notion integration request:', { action, userId });

    switch (action) {
      case 'export_to_page':
        if (!summaryData) {
          return NextResponse.json(
            { success: false, error: 'Summary data is required' },
            { status: 400 }
          );
        }

        const pageResult = await exportSummaryToNotionPage(summaryData, options);
        
        if (pageResult.success) {
          // Track the export
          await fetch('/api/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'export_completed',
              data: {
                format: 'notion_page',
                summaryId: summaryData.id,
                pageId: pageResult.pageId
              }
            })
          });
        }

        return NextResponse.json(pageResult);

      case 'export_to_database':
        if (!summaryData) {
          return NextResponse.json(
            { success: false, error: 'Summary data is required' },
            { status: 400 }
          );
        }

        const databaseResult = await exportSummaryToNotionDatabase(
          summaryData, 
          options?.databaseId
        );
        
        if (databaseResult.success) {
          // Track the export
          await fetch('/api/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'export_completed',
              data: {
                format: 'notion_database',
                summaryId: summaryData.id,
                pageId: databaseResult.pageId
              }
            })
          });
        }

        return NextResponse.json(databaseResult);

      case 'validate_connection':
        const validationResult = await validateNotionConnection();
        return NextResponse.json(validationResult);

      case 'list_databases':
        const databasesResult = await listNotionDatabases();
        return NextResponse.json(databasesResult);

      case 'get_workspace_info':
        const workspaceResult = await getNotionWorkspaceInfo();
        return NextResponse.json(workspaceResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in Notion integration:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const statusResult = await validateNotionConnection();
        return NextResponse.json({
          success: true,
          connected: statusResult.success,
          error: statusResult.error
        });

      case 'databases':
        const databasesResult = await listNotionDatabases();
        return NextResponse.json(databasesResult);

      case 'workspace':
        const workspaceResult = await getNotionWorkspaceInfo();
        return NextResponse.json(workspaceResult);

      default:
        return NextResponse.json({
          success: true,
          message: 'Notion integration API is active',
          availableActions: [
            'export_to_page',
            'export_to_database', 
            'validate_connection',
            'list_databases',
            'get_workspace_info'
          ]
        });
    }

  } catch (error) {
    console.error('Error in Notion integration GET:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
