@echo off
cd /d "D:\shiber bazar\shiber-bazar"
git add -A
git commit -m "Redesign ShopCard: dokanlink-style with cover image, circular logo, verified badge, call/WhatsApp buttons, address, CTA button"
git push origin main
echo.
echo Push successful! Vercel will deploy in a few minutes.
pause
