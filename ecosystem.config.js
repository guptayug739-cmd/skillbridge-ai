module.exports = {
  apps: [
    {
      name: 'skillbridge-api',
      script: './packages/server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      autorestart: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
