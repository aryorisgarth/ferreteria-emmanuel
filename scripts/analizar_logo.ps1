Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\logo.jpeg")
$w = $bmp.Width
$h = $bmp.Height
Write-Host "Dimensiones originales: $w x $h"

# Bounding box del logo completo
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0

for ($y = 0; $y -lt $h; $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 25 -or $c.G -gt 25 -or $c.B -gt 25) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$widthFull = $maxX - $minX
$heightFull = $maxY - $minY
Write-Host "Logo completo: X=$minX..$maxX (Ancho=$widthFull), Y=$minY..$maxY (Alto=$heightFull)"

# Ahora buscar el límite derecho del isotipo (la casita/nave) antes del texto
# El isotipo está a la izquierda y luego hay una separación antes de "FERRETERÍA" y "EMMANUEL"
# Analicemos la densidad de píxeles por columna en el rango X=$minX..$($minX + $widthFull / 2)
$isoMaxX = $minX
for ($x = $minX; $x -lt ($minX + 450); $x++) {
    $hasPixel = $false
    for ($y = $minY; $y -le $maxY; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 25 -or $c.G -gt 25 -or $c.B -gt 25) {
            $hasPixel = $true
            break
        }
    }
    if ($hasPixel) {
        $isoMaxX = $x
    }
}

# Ver el primer punto de separación donde no hay píxeles o hay mínimo entre isotipo y texto
$colCounts = @()
for ($x = $minX; $x -lt ($minX + 500); $x += 2) {
    $count = 0
    for ($y = $minY; $y -le $maxY; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 25 -or $c.G -gt 25 -or $c.B -gt 25) {
            $count++
        }
    }
    $colCounts += [PSCustomObject]@{ X = $x; Count = $count }
}

$gap = $colCounts | Where-Object { $_.X -gt ($minX + 200) -and $_.Count -eq 0 } | Select-Object -First 1
if ($gap) {
    Write-Host "Separación encontrada en X = $($gap.X)"
}

# Tomar isotipo
$isoMinX = $minX
$isoMaxX = if ($gap) { $gap.X } else { $minX + 300 }

# Refinar Bounding Box del Isotipo
$isoMinY = $h; $isoMaxY = 0
for ($x = $isoMinX; $x -le $isoMaxX; $x++) {
    for ($y = $minY; $y -le $maxY; $y++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 25 -or $c.G -gt 25 -or $c.B -gt 25) {
            if ($y -lt $isoMinY) { $isoMinY = $y }
            if ($y -gt $isoMaxY) { $isoMaxY = $y }
        }
    }
}
$isoW = $isoMaxX - $isoMinX
$isoH = $isoMaxY - $isoMinY
Write-Host "Isotipo: X=$isoMinX..$isoMaxX (Ancho=$isoW), Y=$isoMinY..$isoMaxY (Alto=$isoH)"

# Obtener los colores predominantes del logo
$colorSamples = @{}
for ($x = $minX; $x -le $maxX; $x += 10) {
    for ($y = $minY; $y -le $maxY; $y += 10) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 35 -or $c.G -gt 35 -or $c.B -gt 35) {
            $hex = "#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B
            $colorSamples[$hex] = ($colorSamples[$hex] + 1)
        }
    }
}

Write-Host "Colores detectados:"
$colorSamples.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "  Color: $($_.Key) - Frecuencia: $($_.Value)"
}

$bmp.Dispose()
