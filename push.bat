@echo off
cd /d "D:\shiber bazar\shiber-bazar"
git add -A
git commit -m "Redesign dashboard: simple user flow, shop owner request system, admin panel"
git push origin main
echo.
echo ✅ Push সফল হয়েছে! Vercel কয়েক মিনিটে deploy করবে।
pause
