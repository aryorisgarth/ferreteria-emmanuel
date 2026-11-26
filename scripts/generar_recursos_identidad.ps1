Add-Type -AssemblyName System.Drawing

$srcPath = "$PSScriptRoot\..\logo.jpeg"
$publicDir = "$PSScriptRoot\..\public"
$appDir = "$PSScriptRoot\..\src\app"

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Cargado logo.jpeg: $($bmp.Width) x $($bmp.Height)"

# Coordenadas exactas detectadas
# Full Logo: X=320..1312 (W=992), Y=322..572 (H=250)
# Isotipo: X=320..580 (W=260), Y=322..572 (H=250)
$fullX = 320; $fullY = 322; $fullW = 992; $fullH = 250
$isoX = 320; $isoY = 322; $isoW = 260; $isoH = 250

# 1. Recortar Logo Completo Original (Fondo negro)
$rectFull = New-Object System.Drawing.Rectangle($fullX, $fullY, $fullW, $fullH)
$logoFullBlack = $bmp.Clone($rectFull, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$logoFullBlack.Save("$publicDir\logo-oficial-dark.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Guardado logo-oficial-dark.png ($fullW x $fullH)"

# 2. Recortar Logo Completo con Fondo Transparente
$logoFullTrans = New-Object System.Drawing.Bitmap($fullW, $fullH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $fullH; $y++) {
    for ($x = 0; $x -lt $fullW; $x++) {
        $c = $bmp.GetPixel($fullX + $x, $fullY + $y)
        # Luminosidad / fondo negro
        $lum = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
        if ($lum -lt 30) {
            $logoFullTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Suavizado de bordes anti-aliased contra fondo negro
            $alpha = if ($lum -lt 60) { [int](($lum - 25) / 35.0 * 255) } else { 255 }
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
            $logoFullTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
    }
}
$logoFullTrans.Save("$publicDir\logo-oficial.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoFullTrans.Save("$publicDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Guardado logo-oficial.png y logo.png (transparente)"

# 3. Recortar Isotipo (260 x 250)
$isoTrans = New-Object System.Drawing.Bitmap($isoW, $isoH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $isoH; $y++) {
    for ($x = 0; $x -lt $isoW; $x++) {
        $c = $bmp.GetPixel($isoX + $x, $isoY + $y)
        $lum = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
        if ($lum -lt 30) {
            $isoTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $alpha = if ($lum -lt 60) { [int](($lum - 25) / 35.0 * 255) } else { 255 }
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
            $isoTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
    }
}
$isoTrans.Save("$publicDir\isotipo.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Guardado isotipo.png"

# Función para generar iconos cuadrados con escala de alta calidad
function Generar-IconoCuadrado($srcBmp, $size, $outPath, $conFondo, $bgColor) {
    $targetBmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($conFondo) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
        # Padding del 10%
        $pad = [int]($size * 0.10)
        $drawSize = $size - ($pad * 2)
        $aspect = $srcBmp.Width / $srcBmp.Height
        if ($aspect -gt 1) {
            $dw = $drawSize
            $dh = [int]($drawSize / $aspect)
            $dx = $pad
            $dy = $pad + [int](($drawSize - $dh) / 2)
        } else {
            $dh = $drawSize
            $dw = [int]($drawSize * $aspect)
            $dy = $pad
            $dx = $pad + [int](($drawSize - $dw) / 2)
        }
        $g.DrawImage($srcBmp, $dx, $dy, $dw, $dh)
    } else {
        # Centrado transparente
        $aspect = $srcBmp.Width / $srcBmp.Height
        if ($aspect -gt 1) {
            $dw = $size
            $dh = [int]($size / $aspect)
            $dx = 0
            $dy = [int](($size - $dh) / 2)
        } else {
            $dh = $size
            $dw = [int]($size * $aspect)
            $dy = 0
            $dx = [int](($size - $dw) / 2)
        }
        $g.DrawImage($srcBmp, $dx, $dy, $dw, $dh)
    }

    $g.Dispose()
    $targetBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    Write-Host "Generado: $outPath ($size x $size)"
}

$navyColor = [System.Drawing.Color]::FromArgb(255, 30, 41, 59) # #1E293B

# Generar icon-192.png y icon-512.png para PWA (con fondo institucional sobrio para soporte PWA Android/Chrome)
Generar-IconoCuadrado $isoTrans 192 "$publicDir\icon-192.png" $true $navyColor
Generar-IconoCuadrado $isoTrans 512 "$publicDir\icon-512.png" $true $navyColor

# Generar versión transparente para icon-192-maskable o similar
Generar-IconoCuadrado $isoTrans 192 "$publicDir\icon-192-trans.png" $false $navyColor
Generar-IconoCuadrado $isoTrans 512 "$publicDir\icon-512-trans.png" $false $navyColor

# Apple Touch Icon (180x180 con fondo)
Generar-IconoCuadrado $isoTrans 180 "$publicDir\apple-icon.png" $true $navyColor
Generar-IconoCuadrado $isoTrans 180 "$publicDir\apple-touch-icon.png" $true $navyColor
Generar-IconoCuadrado $isoTrans 180 "$appDir\apple-icon.png" $true $navyColor

# icon.png para Next.js App Router (32x32 y 192x192)
Generar-IconoCuadrado $isoTrans 192 "$publicDir\icon.png" $false $navyColor
Generar-IconoCuadrado $isoTrans 32 "$publicDir\icon-32.png" $false $navyColor
Generar-IconoCuadrado $isoTrans 192 "$appDir\icon.png" $false $navyColor

# Generar favicon.ico multicapa (16x16, 32x32, 48x48)
function Generar-FaviconIco($srcBmp, $icoPath) {
    # Generar tamaños estándar
    $sizes = @(16, 32, 48)
    $bitmaps = @()
    foreach ($sz in $sizes) {
        $b = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($b)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($srcBmp, 0, 0, $sz, $sz)
        $g.Dispose()
        $bitmaps += $b
    }

    # Escribir estructura binaria estándar ICO
    $fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # Header ICO: 2 bytes reservados (0), 2 bytes tipo (1 = ICO), 2 bytes conteo de imágenes (N)
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$sizes.Count)

    # Guardar cada imagen temporalmente como PNG en memoria
    $pngStreams = @()
    foreach ($b in $bitmaps) {
        $ms = New-Object System.IO.MemoryStream
        $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += $ms
    }

    # Offset inicial = Header (6) + (16 * N)
    $offset = 6 + (16 * $sizes.Count)

    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $sz = $sizes[$i]
        $len = $pngStreams[$i].Length
        $bw.Write([byte]$(if ($sz -ge 256) { 0 } else { $sz })) # Width
        $bw.Write([byte]$(if ($sz -ge 256) { 0 } else { $sz })) # Height
        $bw.Write([byte]0) # Color count
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Color planes
        $bw.Write([uint16]32) # Bits per pixel
        $bw.Write([uint32]$len) # Image size in bytes
        $bw.Write([uint32]$offset) # Offset
        $offset += $len
    }

    # Escribir los bytes PNG de cada icono
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $bytes = $pngStreams[$i].ToArray()
        $bw.Write($bytes)
        $pngStreams[$i].Dispose()
        $bitmaps[$i].Dispose()
    }

    $bw.Flush()
    $bw.Dispose()
    $fs.Dispose()
    Write-Host "Generado Favicon multicapa: $icoPath"
}

Generar-FaviconIco $isoTrans "$publicDir\favicon.ico"
Generar-FaviconIco $isoTrans "$appDir\favicon.ico"

# Copiar también logo.jpeg a public para acceso estático directo
Copy-Item $srcPath "$publicDir\logo.jpeg" -Force

$bmp.Dispose()
$logoFullBlack.Dispose()
$logoFullTrans.Dispose()
$isoTrans.Dispose()

Write-Host "Proceso de generación de recursos visuales finalizado con éxito."
