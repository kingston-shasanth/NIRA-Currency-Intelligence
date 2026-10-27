# NIRA AI — Active Wi-Fi / Laptop Hotspot IPv4 Detection
param(
    [string]$Mode = "Default"
)

$ErrorActionPreference = 'SilentlyContinue'

$allIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notmatch "vEthernet|Loopback|Virtual|WSL|Bluetooth|Pseudo|VMware|VirtualBox" -and
    $_.AddressState -eq "Preferred"
}

# 1. Look for Windows Mobile Hotspot adapter (typically 192.168.137.1 or Local Area Connection*)
$hotspot = $allIPs | Where-Object {
    $_.IPAddress -eq "192.168.137.1" -or $_.InterfaceAlias -match "Hotspot" -or ($_.InterfaceAlias -match "Local Area Connection\*\s*2" -and $_.IPAddress -like "192.168.*")
} | Select-Object -First 1

# 2. Look for Wi-Fi adapter
$wifi = $allIPs | Where-Object {
    $_.InterfaceAlias -match "Wi-Fi|Wireless|WLAN"
} | Select-Object -First 1

# 3. Fallback to any other active LAN interface
$fallback = $allIPs | Where-Object {
    $_.InterfaceAlias -match "Ethernet|LAN"
} | Select-Object -First 1

if ($Mode -eq "Hotspot") {
    if ($hotspot) { Write-Output $hotspot.IPAddress.Trim(); exit 0 }
    else { Write-Output "NONE"; exit 0 }
}

if ($Mode -eq "WiFi") {
    if ($wifi) { Write-Output $wifi.IPAddress.Trim(); exit 0 }
    else { Write-Output "NONE"; exit 0 }
}

# Default mode: If hotspot exists, prefer hotspot (direct phone connection), else Wi-Fi, else fallback
if ($hotspot) {
    Write-Output $hotspot.IPAddress.Trim()
} elseif ($wifi) {
    Write-Output $wifi.IPAddress.Trim()
} elseif ($fallback) {
    Write-Output $fallback.IPAddress.Trim()
} else {
    Write-Output "NONE"
}
