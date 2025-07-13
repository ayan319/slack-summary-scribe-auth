#!/bin/bash

# 🚨 Emergency Rollback Script for Slack Summary Scribe
# This script provides automated rollback capabilities for production incidents

set -e  # Exit on any error

# Configuration
DEPLOYMENT_URL="${DEPLOYMENT_URL:-https://your-app.vercel.app}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
HEALTH_ENDPOINT="$DEPLOYMENT_URL/api/health"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/rollback-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${BLUE}$@${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$@${NC}"
}

log_error() {
    log "ERROR" "${RED}$@${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$@${NC}"
}

# Send Slack notification
send_slack_notification() {
    local message="$1"
    local severity="${2:-INFO}"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local emoji="ℹ️"
        case $severity in
            "CRITICAL") emoji="🚨" ;;
            "WARNING") emoji="⚠️" ;;
            "SUCCESS") emoji="✅" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$emoji $severity: $message\",
                \"channel\": \"#alerts\",
                \"username\": \"Emergency Rollback Bot\"
            }" \
            --silent --output /dev/null || true
    fi
}

# Check if Vercel CLI is available
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Installing..."
        npm install -g vercel
        if [ $? -ne 0 ]; then
            log_error "Failed to install Vercel CLI"
            exit 1
        fi
    fi
    log_info "Vercel CLI is available"
}

# Check current service health
check_service_health() {
    log_info "Checking current service health..."
    
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" || echo "000")
    
    if [ "$health_status" = "200" ]; then
        log_success "Service is currently healthy (HTTP $health_status)"
        return 0
    else
        log_error "Service is unhealthy (HTTP $health_status)"
        return 1
    fi
}

# Get list of recent deployments
get_recent_deployments() {
    log_info "Fetching recent deployments..."
    
    vercel ls --json 2>/dev/null | jq -r '.[] | select(.type == "deployment") | "\(.uid) \(.url) \(.created) \(.state)"' | head -10
}

# Perform Vercel rollback
perform_vercel_rollback() {
    local target_deployment="$1"
    
    if [ -z "$target_deployment" ]; then
        log_error "No target deployment specified"
        return 1
    fi
    
    log_info "Rolling back to deployment: $target_deployment"
    send_slack_notification "Starting rollback to deployment $target_deployment" "WARNING"
    
    # Promote the target deployment
    if vercel promote "$target_deployment" --yes; then
        log_success "Rollback completed successfully"
        send_slack_notification "Rollback completed successfully" "SUCCESS"
        return 0
    else
        log_error "Rollback failed"
        send_slack_notification "Rollback failed - manual intervention required" "CRITICAL"
        return 1
    fi
}

# Validate rollback success
validate_rollback() {
    log_info "Validating rollback success..."
    
    # Wait a moment for deployment to propagate
    sleep 30
    
    # Check health endpoint
    local attempts=0
    local max_attempts=10
    
    while [ $attempts -lt $max_attempts ]; do
        if check_service_health; then
            log_success "Rollback validation successful"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log_warn "Health check failed, attempt $attempts/$max_attempts"
        sleep 30
    done
    
    log_error "Rollback validation failed after $max_attempts attempts"
    return 1
}

# Interactive rollback selection
interactive_rollback() {
    log_info "Starting interactive rollback process..."
    
    echo "Recent deployments:"
    echo "=================="
    get_recent_deployments | nl -w2 -s'. '
    echo ""
    
    read -p "Select deployment number to rollback to (or 'q' to quit): " selection
    
    if [ "$selection" = "q" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    local target_deployment=$(get_recent_deployments | sed -n "${selection}p" | awk '{print $1}')
    
    if [ -z "$target_deployment" ]; then
        log_error "Invalid selection"
        exit 1
    fi
    
    echo ""
    read -p "Are you sure you want to rollback to $target_deployment? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    perform_vercel_rollback "$target_deployment"
}

# Automatic rollback to last known good deployment
automatic_rollback() {
    log_info "Starting automatic rollback to last known good deployment..."
    
    # Get the second most recent deployment (assuming current is broken)
    local target_deployment=$(get_recent_deployments | sed -n '2p' | awk '{print $1}')
    
    if [ -z "$target_deployment" ]; then
        log_error "No previous deployment found for automatic rollback"
        exit 1
    fi
    
    log_info "Automatically rolling back to: $target_deployment"
    perform_vercel_rollback "$target_deployment"
}

# Emergency health check and auto-rollback
emergency_check() {
    log_info "Performing emergency health check..."
    
    if check_service_health; then
        log_success "Service is healthy, no rollback needed"
        exit 0
    fi
    
    log_warn "Service is unhealthy, initiating automatic rollback..."
    send_slack_notification "Service unhealthy - initiating emergency rollback" "CRITICAL"
    
    automatic_rollback
    
    if validate_rollback; then
        log_success "Emergency rollback completed successfully"
        send_slack_notification "Emergency rollback completed - service restored" "SUCCESS"
    else
        log_error "Emergency rollback failed - manual intervention required"
        send_slack_notification "Emergency rollback failed - URGENT manual intervention required" "CRITICAL"
        exit 1
    fi
}

# Create incident report
create_incident_report() {
    local incident_file="$SCRIPT_DIR/incident-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$incident_file" << EOF
# Incident Report - $(date '+%Y-%m-%d %H:%M:%S')

## Incident Details
- **Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **Severity**: [To be determined]
- **Duration**: [To be determined]
- **Impact**: [To be determined]

## Timeline
- **$(date '+%H:%M:%S')**: Rollback script initiated
- **$(date '+%H:%M:%S')**: [Add timeline events]

## Actions Taken
- Emergency rollback performed
- Service health validated
- Stakeholders notified

## Root Cause
[To be investigated]

## Resolution
[To be documented]

## Follow-up Actions
- [ ] Root cause analysis
- [ ] Preventive measures
- [ ] Process improvements
- [ ] Team communication

## Logs
See: $LOG_FILE
EOF

    log_info "Incident report created: $incident_file"
}

# Show usage information
show_usage() {
    cat << EOF
🚨 Emergency Rollback Script for Slack Summary Scribe

Usage: $0 [OPTION]

Options:
  -i, --interactive     Interactive rollback with deployment selection
  -a, --automatic       Automatic rollback to previous deployment
  -e, --emergency       Emergency health check and auto-rollback if needed
  -h, --help           Show this help message

Environment Variables:
  DEPLOYMENT_URL       Target deployment URL (default: https://your-app.vercel.app)
  SLACK_WEBHOOK_URL    Slack webhook for notifications

Examples:
  $0 --emergency                    # Check health and rollback if needed
  $0 --interactive                  # Choose specific deployment to rollback to
  $0 --automatic                    # Rollback to previous deployment
  
  DEPLOYMENT_URL=https://my-app.vercel.app $0 --emergency

EOF
}

# Main script logic
main() {
    log_info "Emergency Rollback Script Started"
    log_info "Target URL: $DEPLOYMENT_URL"
    log_info "Log file: $LOG_FILE"
    
    # Check prerequisites
    check_vercel_cli
    
    # Parse command line arguments
    case "${1:-}" in
        -i|--interactive)
            interactive_rollback
            ;;
        -a|--automatic)
            automatic_rollback
            ;;
        -e|--emergency)
            emergency_check
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        "")
            log_warn "No option specified, defaulting to emergency check"
            emergency_check
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
    
    # Validate the rollback
    if validate_rollback; then
        create_incident_report
        log_success "Rollback process completed successfully"
    else
        log_error "Rollback validation failed"
        exit 1
    fi
}

# Trap to ensure cleanup on exit
trap 'log_info "Script execution completed"' EXIT

# Run main function with all arguments
main "$@"
