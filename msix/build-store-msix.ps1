# Build the exact MSIX identity reserved in Microsoft Partner Center.
# This creates an UNSIGNED Store SUBMISSION DRAFT, not a directly installable app.
# Microsoft Store re-signs accepted MSIX packages during publication.
param(
    [string]$BuildFolder = "dist/MINEVORA",
    [string]$Manifest = "msix/AppxManifest.xml",
    [string]$OutputFolder = "dist/store-msix"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path ".").Path
$source = (Resolve-Path $BuildFolder).Path
$manifest = (Resolve-Path $Manifest).Path
$out = Join-Path $repo $OutputFolder
$layout = Join-Path $out "layout"
$unpacked = Join-Path $out "unpacked"
$msix = Join-Path $out "MINEVORA_Launcher_0.2.0.0_x64_STORE_DRAFT.msix"

foreach ($path in @($layout, $unpacked)) {
    if (Test-Path $path) { Remove-Item -LiteralPath $path -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $path | Out-Null
}
Get-ChildItem -LiteralPath $source -Force | ForEach-Object {
    if ($_.Name -ne "UNSIGNED_BUILD.txt") {
        Copy-Item -LiteralPath $_.FullName -Destination $layout -Recurse -Force
    }
}
Copy-Item -LiteralPath $manifest -Destination (Join-Path $layout "AppxManifest.xml") -Force
$assets = Join-Path $layout "Assets"
python -m msix.create_assets --source "assets/minevora_logo.png" --destination $assets
if ($LASTEXITCODE -ne 0) { throw "Unable to generate MINEVORA icon assets" }

$toolDir = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
$makeappx = Get-ChildItem -LiteralPath $toolDir -Filter makeappx.exe -Recurse |
    Where-Object { $_.FullName.EndsWith("\x64\makeappx.exe", [StringComparison]::OrdinalIgnoreCase) } |
    Sort-Object FullName -Descending | Select-Object -First 1
if (!$makeappx) { throw "Windows SDK makeappx.exe x64 missing" }

# Validate package manifest identity BEFORE uploading anything to Partner Center.
[xml]$xml = Get-Content -LiteralPath (Join-Path $layout "AppxManifest.xml") -Raw
$identity = $xml.Package.Identity
if ($identity.Name -ne "MINEVORA.MINEVORALauncher" -or
    $identity.Publisher -ne "CN=7E2F1067-3B52-463F-A3BC-3AEFC8F3160B" -or
    $identity.ProcessorArchitecture -ne "x64" -or
    $identity.Version -ne "0.2.0.0") {
    throw "MSIX identity does not match MINEVORA's Microsoft Store reservation"
}
if (!(Test-Path (Join-Path $layout "MINEVORA.exe"))) {
    throw "MINEVORA.exe is missing from MSIX package root"
}
& $makeappx.FullName pack /d $layout /p $msix /o /v
if ($LASTEXITCODE -ne 0) { throw "MSIX MakeAppx packaging failed" }
& $makeappx.FullName unpack /p $msix /d $unpacked /o
if ($LASTEXITCODE -ne 0) { throw "MSIX MakeAppx unpack validation failed" }

foreach ($name in @("MINEVORA.exe", "AppxManifest.xml", "Assets\StoreLogo.png",
                    "Assets\Square44x44Logo.png", "Assets\Square150x150Logo.png",
                    "_internal\desktop\native-bridge.js")) {
    if (!(Test-Path (Join-Path $unpacked $name))) { throw "MSIX missing: $name" }
}
$hash = (Get-FileHash -Path $msix -Algorithm SHA256).Hash
$readme = @(
    "MINEVORA Launcher - Microsoft Store MSIX DRAFT",
    "",
    "Reserved product: MINEVORA Launcher",
    "Store ID: 9MWBQH7NWQL1",
    "Package Name: MINEVORA.MINEVORALauncher",
    "Publisher: CN=7E2F1067-3B52-463F-A3BC-3AEFC8F3160B",
    "MSIX SHA256: $hash",
    "",
    "UNSIGNED: do not double-click or sideload this draft on Windows.",
    "Intended ONLY for manual upload into a DRAFT MSIX submission",
    "by the authorized Microsoft Partner Center publisher.",
    "The Microsoft Store signs an accepted MSIX as part of publishing.",
    "Do not upload the separate Inno Setup EXE.",
    "No Windows Smart App Control bypass or security change is needed.",
    "This packaging build does NOT establish Store acceptance or app runtime compatibility."
)
Set-Content -LiteralPath (Join-Path $out "READ_ME_STORE_DRAFT.txt") -Value $readme -Encoding UTF8
Write-Host "Validated draft MSIX created:" $msix
Write-Host "SHA256:" $hash
