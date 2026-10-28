Add-Type -AssemblyName System.Drawing

function Add-RoundedRectPath {
    param(
        [System.Drawing.Drawing2D.GraphicsPath]$path,
        [float]$x, [float]$y, [float]$w, [float]$h, [float]$r
    )
    $d = $r * 2.0
    if ($d -gt $w) { $d = $w }
    if ($d -gt $h) { $d = $h }
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
}

function Draw-PartnerLogo {
    param(
        [System.Drawing.Graphics]$g,
        [int]$size,
        [bool]$drawBackground = $false,
        [bool]$isRound = $false
    )

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = [float]($size / 1024.0)

    if ($drawBackground) {
        # Background gradient: deep sapphire to royal blue
        $rect = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
        if ($isRound) {
            # Circular clip for round icon
            $clipPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
            $clipPath.AddEllipse(0, 0, $size, $size)
            $g.SetClip($clipPath)
        }
        
        $cTop = [System.Drawing.Color]::FromArgb(255, 7, 21, 58)      # #07153a
        $cBottom = [System.Drawing.Color]::FromArgb(255, 0, 82, 255)   # #0052FF
        $brushBg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            [System.Drawing.Point]::new(0, 0),
            [System.Drawing.Point]::new(0, $size),
            $cTop,
            $cBottom
        )
        $g.FillRectangle($brushBg, $rect)
        $brushBg.Dispose()

        # Subtle ambient radial glow in upper-middle
        $glowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 56, 189, 248))
        $glowRect = [System.Drawing.RectangleF]::new(200 * $scale, 180 * $scale, 624 * $scale, 624 * $scale)
        $g.FillEllipse($glowBrush, $glowRect)
        $glowBrush.Dispose()

        # Elegant concentric safe-ring accent
        $ringPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(45, 255, 255, 255), 2 * $scale)
        $g.DrawEllipse($ringPen, [System.Drawing.RectangleF]::new(212 * $scale, 212 * $scale, 600 * $scale, 600 * $scale))
        $ringPen.Dispose()

        if ($isRound) {
            $g.ResetClip()
            # Smooth circular outer border
            $borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(140, 255, 255, 255), 4 * $scale)
            $g.DrawEllipse($borderPen, [System.Drawing.RectangleF]::new(2 * $scale, 2 * $scale, ($size - 4 * $scale), ($size - 4 * $scale)))
            $borderPen.Dispose()
        }
    }

    # Center is at (512 * scale, 512 * scale)
    $cx = [float](512.0 * $scale)

    # 1. Luxury Emblem: Crown / Stylized "H" with Diamonds & Star
    $goldBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0)) # Gold #FFD700
    $cyanBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248)) # Cyan #38BDF8
    $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    
    # Center-top star/sparkle at (512, 280)
    $starPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $starPoints = @(
        [System.Drawing.PointF]::new($cx, (260 * $scale)),
        [System.Drawing.PointF]::new($cx + 8 * $scale, (278 * $scale)),
        [System.Drawing.PointF]::new($cx + 26 * $scale, (284 * $scale)),
        [System.Drawing.PointF]::new($cx + 10 * $scale, (292 * $scale)),
        [System.Drawing.PointF]::new($cx + 16 * $scale, (310 * $scale)),
        [System.Drawing.PointF]::new($cx, (298 * $scale)),
        [System.Drawing.PointF]::new($cx - 16 * $scale, (310 * $scale)),
        [System.Drawing.PointF]::new($cx - 10 * $scale, (292 * $scale)),
        [System.Drawing.PointF]::new($cx - 26 * $scale, (284 * $scale)),
        [System.Drawing.PointF]::new($cx - 8 * $scale, (278 * $scale))
    )
    $starPath.AddPolygon($starPoints)
    $g.FillPath($goldBrush, $starPath)
    $starPath.Dispose()

    # Stylized Royal Pillars of 'H' (Celebration & Venue Arch)
    # Left Pillar
    $leftPillar = [System.Drawing.Drawing2D.GraphicsPath]::new()
    Add-RoundedRectPath -path $leftPillar -x ($cx - 96 * $scale) -y (320 * $scale) -w (32 * $scale) -h (105 * $scale) -r (16 * $scale)
    $g.FillPath($whiteBrush, $leftPillar)
    $leftPillar.Dispose()

    # Right Pillar
    $rightPillar = [System.Drawing.Drawing2D.GraphicsPath]::new()
    Add-RoundedRectPath -path $rightPillar -x ($cx + 64 * $scale) -y (320 * $scale) -w (32 * $scale) -h (105 * $scale) -r (16 * $scale)
    $g.FillPath($whiteBrush, $rightPillar)
    $rightPillar.Dispose()

    # Center Celebration Arch / Bridge with upward chevron/diamond
    $archPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 22 * $scale)
    $archPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $archPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($archPen, ($cx - 72 * $scale), (375 * $scale), ($cx + 72 * $scale), (375 * $scale))
    $archPen.Dispose()

    # Center Sparkling Diamond
    $diamondPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diamondPoints = @(
        [System.Drawing.PointF]::new($cx, (350 * $scale)),
        [System.Drawing.PointF]::new($cx + 18 * $scale, (375 * $scale)),
        [System.Drawing.PointF]::new($cx, (400 * $scale)),
        [System.Drawing.PointF]::new($cx - 18 * $scale, (375 * $scale))
    )
    $diamondPath.AddPolygon($diamondPoints)
    $g.FillPath($goldBrush, $diamondPath)
    $diamondPath.Dispose()

    # 2. Typography: "happylokam"
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    try {
        $fontFamily = [System.Drawing.FontFamily]::new("Segoe UI")
    } catch {
        try { $fontFamily = [System.Drawing.FontFamily]::new("Arial") } catch {}
    }

    $titleFont = [System.Drawing.Font]::new($fontFamily, (60 * $scale), [System.Drawing.FontStyle]::Bold)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = [System.Drawing.RectangleF]::new(($cx - 300 * $scale), (445 * $scale), (600 * $scale), (80 * $scale))
    $g.DrawString("happylokam", $titleFont, $whiteBrush, $textRect, $sf)
    $titleFont.Dispose()

    # 3. Premium Partner Pill Badge
    $pillW = [float](240.0 * $scale)
    $pillH = [float](50.0 * $scale)
    $pillX = [float]($cx - ($pillW / 2.0))
    $pillY = [float](540.0 * $scale)

    $pillPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    Add-RoundedRectPath -path $pillPath -x $pillX -y $pillY -w $pillW -h $pillH -r ([float](25.0 * $scale))
    
    # Dark glass fill with cyan border
    $pillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 10, 25, 60))
    $g.FillPath($pillBrush, $pillPath)
    $pillBrush.Dispose()

    $pillPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 2.5 * $scale)
    $g.DrawPath($pillPen, $pillPath)
    $pillPen.Dispose()
    $pillPath.Dispose()

    # "PARTNER" text inside pill
    $badgeFont = [System.Drawing.Font]::new($fontFamily, (21 * $scale), [System.Drawing.FontStyle]::Bold)
    $goldBadgeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 254, 240, 138)) # #fef08a
    $badgeRect = [System.Drawing.RectangleF]::new($pillX, $pillY + (2 * $scale), $pillW, $pillH)
    $g.DrawString("PARTNER", $badgeFont, $goldBadgeBrush, $badgeRect, $sf)
    $badgeFont.Dispose()
    $goldBadgeBrush.Dispose()

    $goldBrush.Dispose()
    $cyanBrush.Dispose()
    $whiteBrush.Dispose()
    $sf.Dispose()
}

$baseDir = "b:\happylokamcoding\mobile\partner-app"
$resDir = "$baseDir\android\app\src\main\res"

Write-Output "Generating Partner App Adaptive Icons and Mipmaps..."

# 1. 1024x1024 Assets
# assets/icon.png (Full standalone icon with background)
$bmpIcon = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gIcon = [System.Drawing.Graphics]::FromImage($bmpIcon)
Draw-PartnerLogo -g $gIcon -size 1024 -drawBackground $true
$bmpIcon.Save("$baseDir\assets\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gIcon.Dispose()
$bmpIcon.Dispose()

# assets/adaptive-icon.png (Foreground for adaptive icon)
$bmpAdaptive = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gAdaptive = [System.Drawing.Graphics]::FromImage($bmpAdaptive)
Draw-PartnerLogo -g $gAdaptive -size 1024 -drawBackground $false
$bmpAdaptive.Save("$baseDir\assets\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gAdaptive.Dispose()
$bmpAdaptive.Dispose()

# assets/favicon.png
$bmpFav = [System.Drawing.Bitmap]::new(192, 192, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFav = [System.Drawing.Graphics]::FromImage($bmpFav)
Draw-PartnerLogo -g $gFav -size 192 -drawBackground $true
$bmpFav.Save("$baseDir\assets\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gFav.Dispose()
$bmpFav.Dispose()

# assets/splash.png
$bmpSplash = [System.Drawing.Bitmap]::new(1242, 2436, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gSplash = [System.Drawing.Graphics]::FromImage($bmpSplash)
$gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$splashBgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 7, 10, 18)) # #070a12
$gSplash.FillRectangle($splashBgBrush, 0, 0, 1242, 2436)
$splashBgBrush.Dispose()

# Draw centered logo in splash
$splashIcon = [System.Drawing.Bitmap]::FromFile("$baseDir\assets\icon.png")
$gSplash.DrawImage($splashIcon, 321, 918, 600, 600)
$splashIcon.Dispose()
$bmpSplash.Save("$baseDir\assets\splash.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gSplash.Dispose()
$bmpSplash.Dispose()

Write-Output "Assets created. Now exporting Android mipmap densities..."

# 2. Android Mipmaps
$densities = @{
    "mipmap-mdpi" = @{ fg = 108; legacy = 48 }
    "mipmap-hdpi" = @{ fg = 162; legacy = 72 }
    "mipmap-xhdpi" = @{ fg = 216; legacy = 96 }
    "mipmap-xxhdpi" = @{ fg = 324; legacy = 144 }
    "mipmap-xxxhdpi" = @{ fg = 432; legacy = 192 }
}

foreach ($folder in $densities.Keys) {
    $targetDir = "$resDir\$folder"
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    $fgSize = $densities[$folder].fg
    $legSize = $densities[$folder].legacy

    # Foreground (108dp canvas)
    $bmpFg = [System.Drawing.Bitmap]::new($fgSize, $fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmpFg)
    Draw-PartnerLogo -g $g -size $fgSize -drawBackground $false
    $bmpFg.Save("$targetDir\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmpFg.Dispose()

    # Legacy square icon
    $bmpSquare = [System.Drawing.Bitmap]::new($legSize, $legSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmpSquare)
    Draw-PartnerLogo -g $g -size $legSize -drawBackground $true -isRound $false
    $bmpSquare.Save("$targetDir\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmpSquare.Dispose()

    # Legacy round icon
    $bmpRound = [System.Drawing.Bitmap]::new($legSize, $legSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmpRound)
    Draw-PartnerLogo -g $g -size $legSize -drawBackground $true -isRound $true
    $bmpRound.Save("$targetDir\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmpRound.Dispose()

    Write-Output "Generated $folder (fg: ${fgSize}x${fgSize}, legacy: ${legSize}x${legSize})"
}

Write-Output "ALL PARTNER APP ICONS GENERATED SUCCESSFULLY!"
