// ══════════════════════════════════════════════════════
//  ExpertMRI — PM2 Ecosystem Configuration
//  Usage: pm2 start ecosystem.config.cjs
// ══════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      name: 'expertmri',
      script: 'server/dist/index.js',
      cwd: '/var/www/expertmri',
      instances: 'max',         // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/expertmri-error.log',
      out_file: '/var/log/pm2/expertmri-out.log',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Auto-restart on crash
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
