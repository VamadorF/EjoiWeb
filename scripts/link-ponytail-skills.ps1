# Junctions a ponytail/skills en ejoiFE (misma máquina / layout C:\ejoi\).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $root '..\ejoiFE\ejoi\ponytail\skills' | Resolve-Path
$destRoot = Join-Path $root '.cursor\skills'
New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
@('ponytail', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-gain', 'ponytail-help') | ForEach-Object {
  $dest = Join-Path $destRoot $_
  if (Test-Path $dest) { Remove-Item $dest -Force -Recurse }
  cmd /c mklink /J `"$dest`" `"$srcRoot\$_`" | Out-Null
  Write-Host "linked $_"
}
