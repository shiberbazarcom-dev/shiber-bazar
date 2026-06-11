@echo off
cd /d "D:\shiber bazar\shiber-bazar"
git add -A
git commit -m "Fix mobile search white screen: hide autocomplete dropdown on mobile, use form submit to /search instead"
git push origin main
echo.
echo Push successful! Vercel will deploy in a few minutes.
pause
