@echo off
REM SchoolPortal Deployment Script for Windows
echo 🚀 Starting SchoolPortal Deployment...

REM Check if required tools are installed
echo [INFO] Checking requirements...

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

echo [SUCCESS] All requirements are met!

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully!

REM Generate Prisma client
echo [INFO] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client!
    exit /b 1
)
echo [SUCCESS] Prisma client generated successfully!

REM Build the application
echo [INFO] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build application!
    exit /b 1
)
echo [SUCCESS] Application built successfully!

REM Check environment variables
echo [INFO] Checking environment variables...
if "%DATABASE_URL%"=="" (
    echo [WARNING] DATABASE_URL is not set. Please set it before deployment.
)
if "%NEXTAUTH_SECRET%"=="" (
    echo [WARNING] NEXTAUTH_SECRET is not set. Please set it before deployment.
)
if "%NEXTAUTH_URL%"=="" (
    echo [WARNING] NEXTAUTH_URL is not set. Please set it before deployment.
)

echo [SUCCESS] Deployment preparation completed!
echo [INFO] Next steps:
echo 1. Push your code to GitHub
echo 2. Connect your repository to Vercel
echo 3. Set up environment variables in Vercel
echo 4. Deploy!

pause
