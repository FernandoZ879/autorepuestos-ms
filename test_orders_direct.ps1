$ErrorActionPreference = "Stop"

try {
    $body = @{
        userId = "123e4567-e89b-12d3-a456-426614174000"
        items = @(
            @{
                productId = "123e4567-e89b-12d3-a456-426614174000"
                quantity = 1
                price = 100
            }
        )
    } | ConvertTo-Json

    Write-Host "Sending request to http://localhost:3003/..."
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:3003/" -Body $body -ContentType "application/json"
    Write-Host "Response:"
    Write-Host ($res | ConvertTo-Json -Depth 5)
    Write-Host "Direct test PASSED" -ForegroundColor Green
} catch {
    Write-Host "Direct test FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        Write-Host $reader.ReadToEnd()
    }
}
