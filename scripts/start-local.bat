@echo off
REM ==============================================================================
REM MAREA LOCAL STARTUP SCRIPT (Windows)
REM ==============================================================================

echo ==============================================================================
echo   PROJECT MAREA - STARTING LOCAL CONTAINERIZED STACK
echo ==============================================================================

docker compose down
docker compose up --build -d

echo.
echo ==============================================================================
echo   MAREA Services are starting up!
echo   Frontend Dashboard:  http://localhost:8080
echo   Backend API Health:  http://localhost:5000/api/health
echo   AI Forecasting:      http://localhost:5000/api/forecast
echo ==============================================================================
pause
