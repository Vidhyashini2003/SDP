
$baseUrl = "http://localhost:5000"
$adminEmail = "admin_test@example.com"
$adminPassword = "password123"

try {
    # 1. Login
    echo "Logging in..."
    $loginBody = @{
        email = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    echo "Login successful. Token obtained."

    $headers = @{
        Authorization = "Bearer $token"
    }

    # 2. Get All Staff
    echo "Fetching staff list..."
    $staffList = Invoke-RestMethod -Uri "$baseUrl/api/admin/staff" -Method Get -Headers $headers
    
    if ($staffList.Count -eq 0) {
        echo "No staff found. Cannot proceed with update test."
        exit
    }

    $targetStaff = $staffList[0]
    $targetId = $targetStaff.id
    echo "Targeting staff ID: $targetId (Current Name: $($targetStaff.name), Status: $($targetStaff.account_status))"

    # 3. Update Status
    $newStatus = if ($targetStaff.account_status -eq 'Active') { 'Inactive' } else { 'Active' }
    echo "Updating status to $newStatus..."
    
    $statusBody = @{ status = $newStatus } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/staff/$targetId/status" -Method Put -Headers $headers -Body $statusBody -ContentType "application/json"
    echo "Status update request sent."

    # 4. Update Details
    $newName = "Updated Name " + (Get-Random)
    echo "Updating name to '$newName'..."
    
    $updateBody = @{
        name = $newName
        email = $targetStaff.email
        phone = $targetStaff.phone
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/api/admin/staff/$targetId" -Method Put -Headers $headers -Body $updateBody -ContentType "application/json"
    echo "Details update request sent."

    # 5. Verify Changes
    echo "Verifying changes..."
    $updatedList = Invoke-RestMethod -Uri "$baseUrl/api/admin/staff" -Method Get -Headers $headers
    $updatedStaff = $updatedList | Where-Object { $_.id -eq $targetId }
    
    if ($updatedStaff.account_status -eq $newStatus) {
        echo "SUCCESS: Status updated correctly to $($updatedStaff.account_status)."
    } else {
        echo "FAILURE: Status did not update. Expected $newStatus, got $($updatedStaff.account_status)."
    }

    if ($updatedStaff.name -eq $newName) {
        echo "SUCCESS: Name updated correctly to $($updatedStaff.name)."
    } else {
        echo "FAILURE: Name did not update. Expected $newName, got $($updatedStaff.name)."
    }

} catch {
    echo "Error occurred:"
    echo $_.Exception.Message
    echo $_.ErrorDetails.Message
}
