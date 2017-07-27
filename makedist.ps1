param([switch]$noserver, [switch]$noui)

Push-Location $PSScriptRoot
if (-not $noserver) {
  Set-Location .\server
  Remove-Item .\dist\*
  tsc -m commonjs --outDir .\dist main.ts
  Set-Location dist
  Compress-Archive .\*,..\..\selfupdate.js -DestinationPath server.zip
  bash -c "zsh -c '. ~/.zshrc ; scp server.zip alarm@uniremote:remote'"
  Set-Location ..\..
  Write-Output "Built server"
}

if (-not $noui) {
  Set-Location .\ui
  npm run build
  Set-Location dist
  Compress-Archive .\* -DestinationPath ui.zip
  bash -c "zsh -c '. ~/.zshrc ; scp ui.zip alarm@uniremote:remote'"
  Set-Location ..\..
}

if ((Read-Host -Prompt "Run self update (y/n)? ") -eq "y") {
  Write-Output "Server response:"
  Write-Output (Invoke-WebRequest -Uri "http://uniremote/selfupdate" -Method Post -UseBasicParsing).Content
}

Pop-Location