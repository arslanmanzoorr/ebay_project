# Save Frontend Docker Image to File (Windows)
# This script saves the Docker image to a tar file for transfer to server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Saving Bidsquire Frontend Image" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker paths
$dockerPath = "E:\Docker\resources\bin\docker.exe"

# Set image name and output file
$imageName = "bidsquire-frontend:latest"
$outputFile = "bidsquire-frontend.tar"

Write-Host "Saving image to: $outputFile" -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Save the Docker image
& $dockerPath save -o $outputFile $imageName

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    $fileSizeFormatted = "{0:N2} MB" -f $fileSize
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Image Saved Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "File Details:" -ForegroundColor Cyan
    Write-Host "  - Location: $PWD\$outputFile" -ForegroundColor White
    Write-Host "  - Size: $fileSizeFormatted" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Transfer to server:" -ForegroundColor White
    Write-Host "     scp $outputFile administrator@108.181.167.171:~/bidsquire/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. On server, load the image:" -ForegroundColor White
    Write-Host "     docker load -i ~/bidsquire/$outputFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Deploy with docker-compose:" -ForegroundColor White
    Write-Host "     cd ~/bidsquire/ebay_project" -ForegroundColor Gray
    Write-Host "     docker-compose up -d frontend" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "X Failed to save image" -ForegroundColor Red
    exit 1
}

