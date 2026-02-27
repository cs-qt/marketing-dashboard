#!/bin/bash
# ══════════════════════════════════════════════════════
#  ExpertMRI — VPS Deployment Script (Bare Metal)
#  Target: Ubuntu 22.04 LTS
#
#  Prerequisites:
#    - Node.js 20+ installed
#    - PM2 installed globally: npm install -g pm2
#    - Nginx installed
#    - MongoDB Atlas URI configured in .env
#    - AWS S3 bucket + credentials configured in .env
#    - Domain DNS pointing to server IP
#
#  Usage:
#    chmod +x deploy/deploy.sh
#    ./deploy/deploy.sh          # Full deploy
#    ./deploy/deploy.sh --quick  # Skip SSL + nginx setup
# ══════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/var/www/expertmri"
DOMAIN="dashboard.expertmri.com"
LOG_DIR="/var/log/pm2"

echo "═══════════════════════════════════════════════"
echo "  ExpertMRI Dashboard — Deployment"
echo "═══════════════════════════════════════════════"
echo ""

# ── 1. Create directories ──
echo "→ Creating directories..."
sudo mkdir -p "$APP_DIR" "$LOG_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

# ── 2. Copy/pull source ──
echo "→ Syncing source code..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  echo "  (Copy project files to $APP_DIR or git clone)"
  echo "  rsync -avz --exclude='node_modules' --exclude='.env' ./ $APP_DIR/"
  rsync -avz --exclude='node_modules' --exclude='.env' --exclude='dist' ./ "$APP_DIR/"
fi

cd "$APP_DIR"

# ── 3. Check .env ──
if [ ! -f .env ]; then
  echo "⚠  No .env file found. Copy .env.example and configure:"
  echo "   cp .env.example .env && nano .env"
  exit 1
fi

# ── 4. Install dependencies ──
echo "→ Installing dependencies..."
npm ci

# ── 5. Build ──
echo "→ Building shared types..."
npm run build -w shared

echo "→ Building server..."
npm run build -w server

echo "→ Building client..."
npm run build -w client

# ── 6. Seed admin user (first-time only) ──
echo "→ Checking admin user..."
cd server && npx ts-node src/seeds/seedUsers.ts admin@expertmri.com Admin 2>/dev/null || true
cd ..

# ── 7. PM2 restart ──
echo "→ Starting/restarting PM2..."
pm2 delete expertmri 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save

# Set PM2 to start on boot
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

# ── 8. Nginx + SSL (skip with --quick) ──
if [ "${1:-}" != "--quick" ]; then
  echo "→ Configuring Nginx..."
  
  # Copy nginx config
  sudo cp deploy/nginx.conf "/etc/nginx/sites-available/expertmri"
  sudo ln -sf "/etc/nginx/sites-available/expertmri" "/etc/nginx/sites-enabled/"
  sudo rm -f "/etc/nginx/sites-enabled/default"
  
  # Test nginx config
  sudo nginx -t
  
  # SSL with Let's Encrypt
  if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "→ Obtaining SSL certificate..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@expertmri.com
  else
    echo "  SSL certificate already exists"
  fi
  
  # Reload nginx
  sudo systemctl reload nginx
  
  echo "→ Setting up auto-renewal..."
  sudo certbot renew --dry-run 2>/dev/null || true
fi

# ── 9. Health check ──
echo ""
echo "→ Health check..."
sleep 3
HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo '{"error":"failed"}')
echo "  $HEALTH"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo ""
echo "  App:    http://localhost:5000"
if [ "${1:-}" != "--quick" ]; then
  echo "  Live:   https://$DOMAIN"
fi
echo "  Health: http://localhost:5000/api/health"
echo ""
echo "  PM2:    pm2 status / pm2 logs expertmri"
echo "  Nginx:  sudo systemctl status nginx"
echo "═══════════════════════════════════════════════"
