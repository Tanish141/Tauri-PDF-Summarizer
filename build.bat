@echo off
echo Building PDF Summarizer...

echo Installing dependencies...
npm install

echo Building frontend...
npm run build

echo Building Tauri application...
npm run tauri:build

echo Build complete! Check src-tauri/target/release/bundle/ for the executable.
pause
