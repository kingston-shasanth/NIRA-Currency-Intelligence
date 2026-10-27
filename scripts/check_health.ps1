# DRISHTI AI — Fast HTTP Health Check Helper
param(
    [Parameter(Mandatory=$true)]
    [string]$Url,
    [int]$TimeoutSec = 2
)

$ErrorActionPreference = 'SilentlyContinue'
try {
    $res = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
    if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
        exit 0
    }
} catch {
}
exit 1
