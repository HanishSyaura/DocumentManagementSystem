# First, login to get token
$loginBody = @{
    email = "admin@company.com"
    password = "Admin@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResponse.data.accessToken

Write-Host "Token obtained: $($token.Substring(0, 20))..."
Write-Host ""

# Now fetch my-status
$headers = @{
    Authorization = "Bearer $token"
}

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/documents/my-status?limit=3" `
    -Method GET `
    -Headers $headers

Write-Host "Full Response:"
$response | ConvertTo-Json -Depth 10
