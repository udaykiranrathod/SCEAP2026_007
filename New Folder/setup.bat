@echo off
REM SCEAP 2.0 Setup Script (Windows)
REM This script initializes the development environment

echo.
echo ================================
echo SCEAP 2.0 Setup Script - Windows
echo ================================
echo.

REM Backend Setup
echo [1/4] Setting up Backend (.NET Core)...
cd sceap-backend
echo Restoring dependencies...
dotnet restore
echo.
echo Creating database...
dotnet ef database update
echo Backend ready!
echo.

REM Frontend Setup
echo [2/4] Setting up Frontend (React)...
cd ..\sceap-frontend
echo Installing dependencies...
call npm install
echo Frontend ready!
echo.

REM Summary
echo [3/4] Workspace Structure
cd ..
echo Backend path: %cd%\sceap-backend
echo Frontend path: %cd%\sceap-frontend
echo.

REM Instructions
echo ================================
echo Setup Complete!
echo ================================
echo.
echo To start development:
echo.
echo Terminal 1 - Backend:
echo   cd sceap-backend
echo   dotnet run --launch-profile https
echo.
echo Terminal 2 - Frontend:
echo   cd sceap-frontend
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo API Docs:  https://localhost:5001/swagger
echo.
pause
