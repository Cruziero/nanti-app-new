# Regenerate public/ icon set from the master logo PNG.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\pandaa\AppData\Local\Temp\opencode\nanti-logo-src.png"
$out = "public"
if (-not (Test-Path -LiteralPath $src)) { throw "Source logo not found: $src" }

$srcImg = [System.Drawing.Image]::FromFile($src)

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.CompositingQuality = 'HighQuality'
  return @($bmp, $g)
}

function Save-Png($bmp, [string]$name) {
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("  {0,-24} {1}x{2}" -f $name, $bmp.Width, $bmp.Height)
}

# --- plain icons: direct resize (logo already has transparent corners) ---
foreach ($size in @(192, 512)) {
  $c = New-Canvas $size
  $bmp, $g = $c[0], $c[1]
  $g.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
  Save-Png $bmp ("icon-{0}.png" -f $size)
  $g.Dispose(); $bmp.Dispose()
}

# --- apple-touch-icon: full-bleed, no transparency (iOS masks it itself) ---
$c = New-Canvas 180
$bmp, $g = $c[0], $c[1]
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0, 0, 180, 180)))
Save-Png $bmp "apple-touch-icon.png"
$g.Dispose(); $bmp.Dispose()

# --- maskable: content inside 80% safe zone, full-bleed green backdrop ---
$green = [System.Drawing.Color]::FromArgb(255, 6, 122, 63)
foreach ($size in @(192, 512)) {
  $c = New-Canvas $size
  $bmp, $g = $c[0], $c[1]
  $g.Clear($green)
  $inner = [int]($size * 0.8)
  $off = [int](($size - $inner) / 2)
  $g.DrawImage($srcImg, (New-Object System.Drawing.Rectangle($off, $off, $inner, $inner)))
  Save-Png $bmp ("maskable-{0}.png" -f $size)
  $g.Dispose(); $bmp.Dispose()
}

# --- favicon.ico: PNG-embedded 16/32/48 entries ---
$icoSizes = @(16, 32, 48)
$blobs = @()
foreach ($s in $icoSizes) {
  $c = New-Canvas $s
  $bmp, $g = $c[0], $c[1]
  $g.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0, 0, $s, $s)))
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $blobs += ,@($ms.ToArray())
  $g.Dispose(); $bmp.Dispose()
}
$dir = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($dir)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$icoSizes.Count)
$offset = 6 + (16 * $icoSizes.Count)
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
  $bw.Write([byte]($icoSizes[$i] % 256))
  $bw.Write([byte]($icoSizes[$i] % 256))
  $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([uint16]1); $bw.Write([uint16]32)
  $bw.Write([uint32]$blobs[$i].Length)
  $bw.Write([uint32]$offset)
  $offset += $blobs[$i].Length
}
$bw.Flush()
$fs = [System.IO.File]::Create((Join-Path $out "favicon.ico"))
$fs.Write($dir.ToArray(), 0, [int]$dir.Length)
foreach ($b in $blobs) { $fs.Write($b, 0, $b.Length) }
$fs.Close()
Write-Output ("  {0,-24} 16/32/48" -f "favicon.ico")

$srcImg.Dispose()
Write-Output "done"
