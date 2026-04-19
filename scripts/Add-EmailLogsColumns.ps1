# Add-EmailLogsColumns.ps1
# Adds required columns to the EmailLogs SharePoint list.
# Requirements:
#   - Run on Windows (PowerShell 5.1+)
#   - CSOM DLLs in C:\CSOM\  (see NuGet extraction note below)
#   - MFA-enabled account supported (device code flow)
#
# NuGet DLL extraction (run once):
#   Install-Package Microsoft.SharePointOnline.CSOM -Provider NuGet -Destination C:\NuGet
#   Copy C:\NuGet\Microsoft.SharePointOnline.CSOM.*\lib\net45\Microsoft.SharePoint.Client.dll         C:\CSOM\
#   Copy C:\NuGet\Microsoft.SharePointOnline.CSOM.*\lib\net45\Microsoft.SharePoint.Client.Runtime.dll C:\CSOM\

param(
    [string]$SiteUrl  = "https://<tenant>.sharepoint.com/sites/<site>",
    [string]$ListName = "EmailLogs",
    [string]$UserName = "<your-email>@<tenant>.onmicrosoft.com"
)

# ── Load CSOM ────────────────────────────────────────────────────────────────
Add-Type -Path "C:\CSOM\Microsoft.SharePoint.Client.dll"
Add-Type -Path "C:\CSOM\Microsoft.SharePoint.Client.Runtime.dll"

# ── Device Code Flow (MFA-compatible) ────────────────────────────────────────
$tenantId  = ($SiteUrl -replace "https://([^.]+)\.sharepoint\.com.*", '$1') + ".onmicrosoft.com"
$clientId  = "9bc3ab49-b65d-410a-85ad-de819febfddc"  # SharePoint Online PowerShell
$resource  = "https://sharepoint.com"

$dcResp = Invoke-RestMethod -Method POST `
    -Uri "https://login.microsoftonline.com/$tenantId/oauth2/devicecode" `
    -Body @{ client_id = $clientId; resource = $resource }

Write-Host "`n$($dcResp.message)`n" -ForegroundColor Cyan

$tokenResp = $null
$deadline  = (Get-Date).AddSeconds($dcResp.expires_in)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $dcResp.interval
    try {
        $tokenResp = Invoke-RestMethod -Method POST `
            -Uri "https://login.microsoftonline.com/$tenantId/oauth2/token" `
            -Body @{
                grant_type  = "urn:ietf:params:oauth:grant-type:device_code"
                client_id   = $clientId
                device_code = $dcResp.device_code
            }
        break
    } catch {
        if ($_.ErrorDetails.Message -notmatch "authorization_pending") { throw }
    }
}
if (-not $tokenResp) { throw "Authentication timed out." }
$accessToken = $tokenResp.access_token

# ── CSOM context with bearer token ───────────────────────────────────────────
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$ctx.ExecutingWebRequest += {
    param($src, $e)
    $e.WebRequestExecutor.RequestHeaders.Add("Authorization", "Bearer $accessToken")
}

$list = $ctx.Web.Lists.GetByTitle($ListName)
$ctx.Load($list)
$ctx.ExecuteQuery()

function Add-TextField {
    param([string]$Name, [string]$DisplayName)
    $fi = New-Object Microsoft.SharePoint.Client.FieldCreationInformation
    $fi.Title        = $DisplayName
    $fi.InternalName = $Name
    $fi.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::Text
    $list.Fields.Add($fi) | Out-Null
    $ctx.ExecuteQuery()
    Write-Host "  + Text: $DisplayName"
}

function Add-NoteField {
    param([string]$Name, [string]$DisplayName)
    $fi = New-Object Microsoft.SharePoint.Client.FieldCreationInformation
    $fi.Title        = $DisplayName
    $fi.InternalName = $Name
    $fi.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::Note
    $list.Fields.Add($fi) | Out-Null
    $ctx.ExecuteQuery()
    Write-Host "  + Note: $DisplayName"
}

function Add-DateTimeField {
    param([string]$Name, [string]$DisplayName)
    $fi = New-Object Microsoft.SharePoint.Client.FieldCreationInformation
    $fi.Title        = $DisplayName
    $fi.InternalName = $Name
    $fi.FieldTypeKind = [Microsoft.SharePoint.Client.FieldType]::DateTime
    $list.Fields.Add($fi) | Out-Null
    $ctx.ExecuteQuery()
    Write-Host "  + DateTime: $DisplayName"
}

function Add-ChoiceField {
    param([string]$Name, [string]$DisplayName, [string[]]$Choices)
    $choicesXml = ($Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ""
    $xml = "<Field Type='Choice' Name='$Name' DisplayName='$DisplayName'>" +
           "<CHOICES>$choicesXml</CHOICES></Field>"
    $list.Fields.AddFieldAsXml($xml, $true,
        [Microsoft.SharePoint.Client.AddFieldOptions]::AddToDefaultContentType) | Out-Null
    $ctx.ExecuteQuery()
    Write-Host "  + Choice: $DisplayName"
}

Write-Host "`nAdding columns to '$ListName'..." -ForegroundColor Green

Add-TextField    "OrderTitle"    "Order Title"
Add-TextField    "OrderID"       "Order ID"
Add-TextField    "TemplateName"  "Template Name"
Add-TextField    "SentBy"        "Sent By"
Add-TextField    "SentTo"        "Sent To"
Add-TextField    "CC"            "CC"
Add-TextField    "Subject"       "Subject"
Add-NoteField    "BodySnapshot"  "Body Snapshot"
Add-DateTimeField "SentAt"       "Sent At"
Add-ChoiceField  "Status"        "Status"   @("Sent","Failed")
Add-TextField    "ErrorMessage"  "Error Message"

Write-Host "`nDone. All columns added to '$ListName'." -ForegroundColor Green
