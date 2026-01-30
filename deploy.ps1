# Script de Deployment Rápido

Write-Host "🚀 Preparando deployment a Cloudflare Pages..." -ForegroundColor Cyan

# 1. Verificar que estás en la rama correcta
Write-Host "`n📝 Verificando rama actual..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "Rama actual: $branch" -ForegroundColor Green

# 2. Verificar cambios pendientes
Write-Host "`n🔍 Verificando cambios..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Hay cambios pendientes:" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "`n¿Hacer commit? (s/n)"
    if ($commit -eq 's') {
        $message = Read-Host "Mensaje del commit"
        git add .
        git commit -m "$message"
        Write-Host "✅ Commit realizado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No hay cambios pendientes" -ForegroundColor Green
}

# 3. Build local (opcional)
Write-Host "`n🔨 ¿Probar build localmente? (s/n)" -ForegroundColor Yellow
$buildLocal = Read-Host
if ($buildLocal -eq 's') {
    Write-Host "Ejecutando build..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build exitoso" -ForegroundColor Green
    } else {
        Write-Host "❌ Build falló" -ForegroundColor Red
        exit 1
    }
}

# 4. Push a GitHub
Write-Host "`n📤 ¿Hacer push a GitHub? (s/n)" -ForegroundColor Yellow
$push = Read-Host
if ($push -eq 's') {
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push exitoso" -ForegroundColor Green
        Write-Host "`n🎉 Cloudflare Pages detectará el cambio y desplegará automáticamente" -ForegroundColor Cyan
        Write-Host "Ve a https://dash.cloudflare.com para ver el progreso" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Push falló" -ForegroundColor Red
    }
}

Write-Host "`n✨ ¡Proceso completado!" -ForegroundColor Green
