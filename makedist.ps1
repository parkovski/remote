param([switch]$noserver, [switch]$noui, [string]$sshname='alarmpi', [string]$dnsname='uniremote')

if (-not $noserver) {
  Remove-Item .\server\dist\*
  tsc -m commonjs --outDir .\server\dist .\server\main.ts
  Compress-Archive .\server\dist\*,.\selfupdate.js -DestinationPath .\server\dist\server.zip
  scp ./server/dist/server.zip "${sshname}:remote"
  Write-Output "Built server"
}

if (-not $noui) {
  Set-Location .\ui
  npm run build
  Set-Location ..
  Compress-Archive .\ui\dist\* -DestinationPath .\ui\dist\ui.zip
  scp ./ui/dist/ui.zip "${sshname}:remote"
}

if ((Read-Host -Prompt "Run self update (y/n)? ") -eq "y") {
  Write-Output "Server response:"
  Write-Output (Invoke-WebRequest -Uri "http://${dnsname}/selfupdate" -Method Post -UseBasicParsing).Content
}

