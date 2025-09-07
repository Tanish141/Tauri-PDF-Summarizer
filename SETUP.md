# Setup Instructions for PDF Summarizer

## Prerequisites Installation

### 1. Install Rust
Visit [https://rustup.rs/](https://rustup.rs/) and follow the installation instructions for your operating system.

**Windows:**
- Download and run `rustup-init.exe`
- Follow the installation wizard
- Restart your command prompt/terminal

**macOS:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Install Node.js
Visit [https://nodejs.org/](https://nodejs.org/) and download the LTS version for your operating system.

### 3. Verify Installation
```bash
# Check Rust installation
rustc --version
cargo --version

# Check Node.js installation
node --version
npm --version
```

## Project Setup

1. **Navigate to project directory:**
   ```bash
   cd pdf-summarizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production:**
   ```bash
   npm run tauri:build
   ```

## Alternative: Web-Only Version

If you want to test the functionality without installing Rust, you can run just the frontend:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run frontend only:**
   ```bash
   npm run dev
   ```

3. **Open browser to:** `http://localhost:1420`

Note: The web-only version will have limited functionality (no file system access, no Tauri commands).

## Troubleshooting

### Common Issues:

1. **"cargo not found" error:**
   - Ensure Rust is properly installed
   - Restart your terminal/command prompt
   - Check that `~/.cargo/bin` is in your PATH

2. **"tauri command not found":**
   - Run `npm install` to install Tauri CLI
   - Try `npx tauri dev` instead of `npm run tauri:dev`

3. **Build failures:**
   - Ensure you have the latest versions of Rust and Node.js
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Platform-Specific Notes:

**Windows:**
- You may need to install Visual Studio Build Tools
- Ensure Windows SDK is installed

**macOS:**
- You may need to install Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- Install build essentials: `sudo apt-get install build-essential` (Ubuntu/Debian)
- Or equivalent for your distribution
