set shell := ["sh", "-c"]

default: dev

# Install npm dependencies (--ignore-scripts skips esbuild postinstall on NixOS noexec)
install:
  npm install --ignore-scripts

# Start Vite dev server on :8080 (auto-installs if node_modules is missing)
dev:
  @[ -d node_modules ] || npm install --ignore-scripts
  @echo "\033[36m[gfx-lab] Starting Vite dev server...\033[0m"
  node --require ./scripts/fix-noexec.cjs ./node_modules/vite/bin/vite.js --port 8080

# Production build → dist/
build:
  @[ -d node_modules ] || npm install --ignore-scripts
  node --require ./scripts/fix-noexec.cjs ./node_modules/vite/bin/vite.js build

# Preview production build on :8080
preview: build
  node --require ./scripts/fix-noexec.cjs ./node_modules/vite/bin/vite.js preview --port 8080

# Remove build artifacts
clean:
  rm -rf dist node_modules
