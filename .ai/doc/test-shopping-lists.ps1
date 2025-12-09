# Shopping Lists API Test Script
# PowerShell script for automated testing of POST & GET /api/shopping-lists

# Configuration
$baseUrl = "http://localhost:3001"
$accessToken = $env:ACCESS_TOKEN

# Colors
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Cyan"
$warningColor = "Yellow"

# Test counter
$testsPassed = 0
$testsFailed = 0
$testsTotal = 0

# Helper function to run test
function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus,
        [hashtable]$Headers = @{}
    )

    $testsTotal++
    Write-Host "`n=== $TestName ===" -ForegroundColor $infoColor

    try {
        $startTime = Get-Date

        # Prepare curl command
        $curlArgs = @(
            "-X", $Method,
            $Url,
            "-w", "`n%{http_code}",
            "-s"
        )

        # Add headers
        foreach ($header in $Headers.GetEnumerator()) {
            $curlArgs += "-H"
            $curlArgs += "$($header.Key): $($header.Value)"
        }

        # Add body if present
        if ($Body) {
            $curlArgs += "-d"
            $curlArgs += $Body
        }

        # Execute request
        $response = & curl @curlArgs
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds

        # Parse response
        $lines = $response -split "`n"
        $statusCode = [int]$lines[-1]
        $responseBody = ($lines[0..($lines.Length - 2)] -join "`n")

        # Check status code
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASS" -ForegroundColor $successColor
            Write-Host "Status: $statusCode (expected: $ExpectedStatus)" -ForegroundColor $successColor
            Write-Host "Response time: $([math]::Round($duration, 0))ms" -ForegroundColor $successColor
            $testsPassed++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor $errorColor
            Write-Host "Status: $statusCode (expected: $ExpectedStatus)" -ForegroundColor $errorColor
            Write-Host "Response time: $([math]::Round($duration, 0))ms" -ForegroundColor $warningColor
            $testsFailed++
        }

        # Pretty print JSON response
        if ($responseBody) {
            try {
                $json = $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
                Write-Host "Response:" -ForegroundColor $infoColor
                Write-Host $json -ForegroundColor Gray
            } catch {
                Write-Host "Response (raw):" -ForegroundColor $infoColor
                Write-Host $responseBody -ForegroundColor Gray
            }
        }

        return @{
            Success = $statusCode -eq $ExpectedStatus
            StatusCode = $statusCode
            Duration = $duration
            Body = $responseBody
        }

    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor $errorColor
        $testsFailed++
        return $null
    }
}

# Check prerequisites
Write-Host "=== Shopping Lists API Test Suite ===" -ForegroundColor $infoColor
Write-Host "Base URL: $baseUrl" -ForegroundColor $infoColor

if (-not $accessToken) {
    Write-Host "`n❌ ERROR: ACCESS_TOKEN environment variable is not set!" -ForegroundColor $errorColor
    Write-Host "Set it with: `$env:ACCESS_TOKEN = 'YOUR_TOKEN_HERE'" -ForegroundColor $warningColor
    exit 1
}

Write-Host "Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor $infoColor

# Test if server is running
Write-Host "`nChecking if server is running..." -ForegroundColor $infoColor
try {
    $null = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor $successColor
} catch {
    Write-Host "❌ Server is not running or not accessible" -ForegroundColor $errorColor
    Write-Host "Start server with: npm run dev" -ForegroundColor $warningColor
    exit 1
}

# Prepare headers
$authHeaders = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# =============================================================================
# POST /api/shopping-lists Tests
# =============================================================================

Write-Host "`n" + "="*60 -ForegroundColor $infoColor
Write-Host "POST /api/shopping-lists Tests" -ForegroundColor $infoColor
Write-Host "="*60 -ForegroundColor $infoColor

# TC1: Successful creation - full data
$body1 = @{
    name = "Test Lista - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    week_start_date = "2025-01-20"
    items = @(
        @{
            ingredient_name = "mleko"
            quantity = 1
            unit = "l"
            category = "Nabiał"
            sort_order = 0
        },
        @{
            ingredient_name = "chleb"
            quantity = 2
            unit = "szt"
            category = "Pieczywo"
            sort_order = 1
        }
    )
} | ConvertTo-Json -Depth 10

$result1 = Test-Endpoint `
    -TestName "TC1: POST - Successful creation with full data" `
    -Method "POST" `
    -Url "$baseUrl/api/shopping-lists" `
    -Body $body1 `
    -Headers $authHeaders `
    -ExpectedStatus 201

Start-Sleep -Seconds 1

# TC2: Successful creation - minimal data
$body2 = @{
    items = @(
        @{
            ingredient_name = "jajka"
            category = "Nabiał"
            sort_order = 0
        }
    )
} | ConvertTo-Json -Depth 10

Test-Endpoint `
    -TestName "TC2: POST - Successful creation with minimal data" `
    -Method "POST" `
    -Url "$baseUrl/api/shopping-lists" `
    -Body $body2 `
    -Headers $authHeaders `
    -ExpectedStatus 201

Start-Sleep -Seconds 1

# TC3: Validation error - empty items
$body3 = @{
    name = "Empty list"
    items = @()
} | ConvertTo-Json -Depth 10

Test-Endpoint `
    -TestName "TC3: POST - Validation error (empty items)" `
    -Method "POST" `
    -Url "$baseUrl/api/shopping-lists" `
    -Body $body3 `
    -Headers $authHeaders `
    -ExpectedStatus 400

Start-Sleep -Seconds 1

# TC4: Validation error - invalid category
$body4 = @{
    items = @(
        @{
            ingredient_name = "mleko"
            category = "InvalidCategory"
            sort_order = 0
        }
    )
} | ConvertTo-Json -Depth 10

Test-Endpoint `
    -TestName "TC4: POST - Validation error (invalid category)" `
    -Method "POST" `
    -Url "$baseUrl/api/shopping-lists" `
    -Body $body4 `
    -Headers $authHeaders `
    -ExpectedStatus 400

Start-Sleep -Seconds 1

# TC5: Authentication error - no token
$body5 = @{
    items = @(
        @{
            ingredient_name = "mleko"
            category = "Nabiał"
            sort_order = 0
        }
    )
} | ConvertTo-Json -Depth 10

Test-Endpoint `
    -TestName "TC5: POST - Authentication error (no token)" `
    -Method "POST" `
    -Url "$baseUrl/api/shopping-lists" `
    -Body $body5 `
    -Headers @{"Content-Type" = "application/json"} `
    -ExpectedStatus 401

Start-Sleep -Seconds 1

# =============================================================================
# GET /api/shopping-lists Tests
# =============================================================================

Write-Host "`n" + "="*60 -ForegroundColor $infoColor
Write-Host "GET /api/shopping-lists Tests" -ForegroundColor $infoColor
Write-Host "="*60 -ForegroundColor $infoColor

# TC6: Successful fetch - default pagination
Test-Endpoint `
    -TestName "TC6: GET - Successful fetch (default pagination)" `
    -Method "GET" `
    -Url "$baseUrl/api/shopping-lists" `
    -Headers @{"Authorization" = "Bearer $accessToken"} `
    -ExpectedStatus 200

Start-Sleep -Seconds 1

# TC7: Successful fetch - custom pagination
Test-Endpoint `
    -TestName "TC7: GET - Successful fetch (custom pagination)" `
    -Method "GET" `
    -Url "$baseUrl/api/shopping-lists?page=1&limit=5" `
    -Headers @{"Authorization" = "Bearer $accessToken"} `
    -ExpectedStatus 200

Start-Sleep -Seconds 1

# TC8: Validation error - invalid page
Test-Endpoint `
    -TestName "TC8: GET - Validation error (page < 1)" `
    -Method "GET" `
    -Url "$baseUrl/api/shopping-lists?page=0" `
    -Headers @{"Authorization" = "Bearer $accessToken"} `
    -ExpectedStatus 400

Start-Sleep -Seconds 1

# TC9: Validation error - limit too high
Test-Endpoint `
    -TestName "TC9: GET - Validation error (limit > 100)" `
    -Method "GET" `
    -Url "$baseUrl/api/shopping-lists?limit=200" `
    -Headers @{"Authorization" = "Bearer $accessToken"} `
    -ExpectedStatus 400

Start-Sleep -Seconds 1

# TC10: Authentication error - no token
Test-Endpoint `
    -TestName "TC10: GET - Authentication error (no token)" `
    -Method "GET" `
    -Url "$baseUrl/api/shopping-lists" `
    -Headers @{} `
    -ExpectedStatus 401

# =============================================================================
# Test Summary
# =============================================================================

Write-Host "`n" + "="*60 -ForegroundColor $infoColor
Write-Host "Test Summary" -ForegroundColor $infoColor
Write-Host "="*60 -ForegroundColor $infoColor

Write-Host "Total tests: $testsTotal" -ForegroundColor $infoColor
Write-Host "Passed: $testsPassed" -ForegroundColor $successColor
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { $successColor } else { $errorColor })

$passRate = [math]::Round(($testsPassed / $testsTotal) * 100, 2)
Write-Host "Pass rate: $passRate%" -ForegroundColor $(if ($passRate -eq 100) { $successColor } elseif ($passRate -ge 80) { $warningColor } else { $errorColor })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor $successColor
    exit 0
} else {
    Write-Host "`n❌ Some tests failed. Review the output above." -ForegroundColor $errorColor
    exit 1
}
