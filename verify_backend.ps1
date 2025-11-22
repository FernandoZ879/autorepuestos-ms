$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param (
        [string]$Name,
        [scriptblock]$ScriptBlock
    )
    Write-Host "Testing: $Name..." -NoNewline
    try {
        & $ScriptBlock
        Write-Host " [OK]" -ForegroundColor Green
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            Write-Host $reader.ReadToEnd()
        }
    }
}

# 1. Register Client
$clientEmail = "client_$(Get-Random)@test.com"
Test-Endpoint "Register Client" {
    $body = @{
        firstName = "Juan"
        lastName = "Perez"
        email = $clientEmail
        password = "password123"
        address = "Calle Falsa 123"
        phone = "555-1234"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/auth/register" -Body $body -ContentType "application/json"
    if (-not $res.id) { throw "No ID returned" }
}

# 2. Login Client
$clientToken = ""
Test-Endpoint "Login Client" {
    $body = @{
        email = $clientEmail
        password = "password123"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/auth/login" -Body $body -ContentType "application/json"
    if (-not $res.token) { throw "No token returned" }
    if ($res.user.role -ne "client") { throw "Role is not client" }
    $global:clientToken = $res.token
    $global:clientId = $res.user.id
}

# 3. Login Admin
$adminToken = ""
Test-Endpoint "Login Admin" {
    $body = @{
        email = "admin@autoparts.com"
        password = "admin123"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/auth/login" -Body $body -ContentType "application/json"
    if (-not $res.token) { throw "No token returned" }
    if ($res.user.role -ne "admin") { throw "Role is not admin" }
    $global:adminToken = $res.token
}

# 4. Bulk Import Products (Admin)
Test-Endpoint "Bulk Import Products" {
    $products = @(
        @{
            name = "Pastillas de Freno Brembo"
            description = "Alta performance"
            price = 150.00
            category = "Frenos"
            supplier = "Brembo Official"
            sku = "BRM-001"
            imageUrl = "https://example.com/brm001.jpg"
        },
        @{
            name = "Aceite Castrol 5W30"
            description = "Sintetico"
            price = 80.00
            category = "Fluidos"
            supplier = "Castrol"
            sku = "CST-5W30"
            imageUrl = "https://example.com/cst5w30.jpg"
        }
    ) | ConvertTo-Json
    
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/admin/catalog/products/bulk" -Body $products -ContentType "application/json" -Headers @{ Authorization = "Bearer $global:adminToken" }
    if (-not $res.message -match "Imported") { throw "Import failed" }
}

# 5. List Products (Client)
Test-Endpoint "List Products" {
    $res = Invoke-RestMethod -Method Get -Uri "http://localhost:8080/catalog/products?category=Frenos"
    if ($res.Count -eq 0) { throw "No products found" }
    if ($res[0].name -ne "Pastillas de Freno Brembo") { throw "Wrong product found" }
    if ($res[0].supplier -ne "Brembo Official") { throw "Supplier field missing" }
}

# 6. Create Order (Client)
Test-Endpoint "Create Order" {
    # Get product ID first
    $products = Invoke-RestMethod -Method Get -Uri "http://localhost:8080/catalog/products"
    $p1 = $products[0]
    
    $orderBody = @{
        userId = $global:clientId
        items = @(
            @{
                productId = $p1.id
                quantity = 2
                price = $p1.price
            },
            @{
                productId = $p1.id
                quantity = 1
                price = $p1.price
            }
        )
    } | ConvertTo-Json
    
    $res = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/orders" -Body $orderBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $global:clientToken" }
    if ($res.status -ne "PENDING") { throw "Order status incorrect" }
    if ($res.total -ne ($p1.price * 2)) { throw "Order total incorrect" }
}

Write-Host "All tests passed!" -ForegroundColor Green
