param([switch]$noserver, [switch]$noui)

if (-not $noserver) {
  Remove-Item .\server\dist\*
  tsc -m commonjs --outDir .\server\dist .\server\main.ts
  Compress-Archive .\server\dist\*,.\selfupdate.js -DestinationPath .\server\dist\server.zip
  bash -c "zsh -c '. ~/.zshrc ; scp ./server/dist/server.zip alarm@uniremote:remote'"
  Write-Output "Built server"
}

if (-not $noui) {
  Set-Location .\ui
  npm run build
  Set-Location ..
  Compress-Archive .\ui\dist\* -DestinationPath .\ui\dist\ui.zip
  bash -c "zsh -c '. ~/.zshrc ; scp ./ui/dist/ui.zip alarm@uniremote:remote'"
}

if ((Read-Host -Prompt "Run self update (y/n)? ") -eq "y") {
  Write-Output "Server response:"
  Write-Output (Invoke-WebRequest -Uri "http://uniremote/selfupdate" -Method Post -UseBasicParsing).Content
}

Pop-Location
