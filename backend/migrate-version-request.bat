@echo off
echo ========================================
echo Prisma Migration for VersionRequest
echo ========================================
echo.

cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo Step 1: Generating Prisma Client...
echo ----------------------------------------
call npx prisma generate
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma client!
    echo Please make sure you're in the backend directory and npm packages are installed.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating database migration...
echo ----------------------------------------
call npx prisma migrate dev --name add_version_request_model
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create migration!
    echo Please check your database connection and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Migration complete!
echo ========================================
echo.
echo Please restart your backend server for changes to take effect.
echo.
pause
