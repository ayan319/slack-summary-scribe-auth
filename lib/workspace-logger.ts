/**
 * Workspace Creation Logger
 * Comprehensive logging system for workspace auto-creation debugging
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define specific detail types for better type safety
export interface WorkspaceDetails {
  workspace_id?: string;
  workspace_name?: string;
  error_message?: string;
  provider?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkspaceLogEntry {
  user_id: string;
  user_email: string;
  action: 'signup' | 'workspace_created' | 'workspace_failed' | 'audit_fix' | 'health_check';
  status: 'success' | 'error' | 'warning';
  details: WorkspaceDetails;
  timestamp: string;
  source: 'trigger' | 'api' | 'audit' | 'manual';
}

export class WorkspaceLogger {
  private static instance: WorkspaceLogger;
  private logs: WorkspaceLogEntry[] = [];

  static getInstance(): WorkspaceLogger {
    if (!WorkspaceLogger.instance) {
      WorkspaceLogger.instance = new WorkspaceLogger();
    }
    return WorkspaceLogger.instance;
  }

  /**
   * Log workspace creation success
   */
  async logWorkspaceCreated(
    userId: string,
    userEmail: string,
    workspaceId: string,
    workspaceName: string,
    source: 'trigger' | 'api' | 'audit' = 'trigger'
  ) {
    const entry: WorkspaceLogEntry = {
      user_id: userId,
      user_email: userEmail,
      action: 'workspace_created',
      status: 'success',
      details: {
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        created_via: source
      },
      timestamp: new Date().toISOString(),
      source
    };

    await this.writeLog(entry);
    console.log(`✅ Workspace created for ${userEmail}: ${workspaceName} (${workspaceId})`);
  }

  /**
   * Log workspace creation failure
   */
  async logWorkspaceError(
    userId: string,
    userEmail: string,
    error: string,
    details: WorkspaceDetails = {},
    source: 'trigger' | 'api' | 'audit' = 'trigger'
  ) {
    const entry: WorkspaceLogEntry = {
      user_id: userId,
      user_email: userEmail,
      action: 'workspace_failed',
      status: 'error',
      details: {
        error_message: error,
        ...details
      },
      timestamp: new Date().toISOString(),
      source
    };

    await this.writeLog(entry);
    console.error(`❌ Workspace creation failed for ${userEmail}: ${error}`);
  }

  /**
   * Log user signup
   */
  async logUserSignup(
    userId: string,
    userEmail: string,
    provider: string,
    metadata: WorkspaceDetails = {}
  ) {
    const entry: WorkspaceLogEntry = {
      user_id: userId,
      user_email: userEmail,
      action: 'signup',
      status: 'success',
      details: {
        provider,
        ...metadata
      },
      timestamp: new Date().toISOString(),
      source: 'api'
    };

    await this.writeLog(entry);
    console.log(`👤 User signed up: ${userEmail} via ${provider}`);
  }

  /**
   * Log audit fix
   */
  async logAuditFix(
    userId: string,
    userEmail: string,
    workspaceId: string,
    workspaceName: string
  ) {
    const entry: WorkspaceLogEntry = {
      user_id: userId,
      user_email: userEmail,
      action: 'audit_fix',
      status: 'success',
      details: {
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        fixed_by: 'audit_function'
      },
      timestamp: new Date().toISOString(),
      source: 'audit'
    };

    await this.writeLog(entry);
    console.log(`🔧 Audit fixed user ${userEmail}: created ${workspaceName}`);
  }

  /**
   * Log health check
   */
  async logHealthCheck(
    totalUsers: number,
    usersWithOrgs: number,
    usersWithoutOrgs: number,
    orphanedOrgs: number
  ) {
    const healthScore = totalUsers > 0 ? (usersWithOrgs / totalUsers) * 100 : 100;
    const status = usersWithoutOrgs === 0 ? 'success' : 'warning';

    const entry: WorkspaceLogEntry = {
      user_id: 'system',
      user_email: 'system@health-check',
      action: 'health_check',
      status,
      details: {
        total_users: totalUsers,
        users_with_orgs: usersWithOrgs,
        users_without_orgs: usersWithoutOrgs,
        orphaned_orgs: orphanedOrgs,
        health_score: Math.round(healthScore)
      },
      timestamp: new Date().toISOString(),
      source: 'api'
    };

    await this.writeLog(entry);
    console.log(`📊 Health check: ${healthScore}% (${usersWithoutOrgs} users need fixing)`);
  }

  /**
   * Write log entry to storage
   */
  private async writeLog(entry: WorkspaceLogEntry) {
    try {
      // Store in memory for immediate access
      this.logs.push(entry);

      // Keep only last 1000 entries in memory
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }

      // In production, you might want to store logs in a database table
      // For now, we'll use console and local storage
      
      // Store in localStorage for browser debugging (if available)
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('workspace_logs') || '[]');
        existingLogs.push(entry);
        
        // Keep only last 100 entries in localStorage
        const recentLogs = existingLogs.slice(-100);
        localStorage.setItem('workspace_logs', JSON.stringify(recentLogs));
      }

    } catch (error) {
      console.warn('Failed to write workspace log:', error);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): WorkspaceLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs for specific user
   */
  getUserLogs(userId: string): WorkspaceLogEntry[] {
    return this.logs.filter(log => log.user_id === userId);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): WorkspaceLogEntry[] {
    return this.logs.filter(log => log.status === 'error');
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('workspace_logs');
    }
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Check if user has workspace creation logs
   */
  async checkUserWorkspaceStatus(userId: string): Promise<{
    hasWorkspace: boolean;
    creationLog?: WorkspaceLogEntry;
    errorLogs: WorkspaceLogEntry[];
  }> {
    const userLogs = this.getUserLogs(userId);
    const creationLog = userLogs.find(log => 
      log.action === 'workspace_created' && log.status === 'success'
    );
    const errorLogs = userLogs.filter(log => log.status === 'error');

    // Also check database
    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    return {
      hasWorkspace: !!creationLog || (orgData !== null && orgData.length > 0),
      creationLog,
      errorLogs
    };
  }
}

// Export singleton instance
export const workspaceLogger = WorkspaceLogger.getInstance();

// Helper functions for easy logging
export const logWorkspaceCreated = workspaceLogger.logWorkspaceCreated.bind(workspaceLogger);
export const logWorkspaceError = workspaceLogger.logWorkspaceError.bind(workspaceLogger);
export const logUserSignup = workspaceLogger.logUserSignup.bind(workspaceLogger);
export const logAuditFix = workspaceLogger.logAuditFix.bind(workspaceLogger);
export const logHealthCheck = workspaceLogger.logHealthCheck.bind(workspaceLogger);
