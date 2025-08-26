@echo off
echo ========================================
echo    TikTok Automation Tool Setup
echo ========================================
echo.

echo Installing root dependencies...
call npm install

echo.
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo This will start both the backend server (port 5000) 
echo and the frontend React app (port 3000)
echo.
pause

