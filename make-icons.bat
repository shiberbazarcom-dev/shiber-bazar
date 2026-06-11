@echo off
cd /d "%~dp0"
echo PWA icon generator chalano hocche...
node scripts\make-icons.cjs
if %errorlevel% neq 0 (
  echo.
  echo ERROR: Node.js khuje pawa jay ni! PATH check koren.
  pause
) else (
  echo.
  echo Done! public\icon-192.png and public\icon-512.png toiri hoyeche.
  pause
)
