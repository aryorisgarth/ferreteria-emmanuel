$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Write-Host "Iniciando respaldo inmutable de datos en $timestamp..."

$dataFiles = Get-ChildItem -Path "data\*.json"

foreach ($file in $dataFiles) {
    $destName = "$($file.BaseName)_$timestamp$($file.Extension)"
    $destPath = Join-Path "backups" $destName
    Copy-Item -Path $file.FullName -Destination $destPath -Force
    Write-Host "Copiado: $($file.Name) -> $destName"
}

Write-Host "`nCalculando hashes SHA256 de archivos fuente:"
Get-FileHash -Algorithm SHA256 (Get-ChildItem -Path "data\*.json") | Select-Object Path, Hash | Format-Table -AutoSize

Write-Host "`nCalculando hashes SHA256 de respaldos generados:"
Get-FileHash -Algorithm SHA256 (Get-ChildItem -Path "backups\*$timestamp.json") | Select-Object Path, Hash | Format-Table -AutoSize
