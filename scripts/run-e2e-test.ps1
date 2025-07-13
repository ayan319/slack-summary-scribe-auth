# PowerShell script to run E2E onboarding test with required environment variables

# Set test environment variables
$env:NODE_ENV = "test"
$env:RESEND_API_KEY = "test-key"
$env:NEXT_PUBLIC_POSTHOG_KEY = "test-key"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
$env:SUPABASE_SERVICE_ROLE_KEY = "test-key"
$env:OPENROUTER_API_KEY = "test-key"

Write-Host "🧪 Running E2E Onboarding Test with test environment variables..." -ForegroundColor Cyan

# Run the test
npx tsx scripts/e2e-onboarding-test.ts

Write-Host "✅ E2E test completed!" -ForegroundColor Green
