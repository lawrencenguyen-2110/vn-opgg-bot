module.exports = {
  apps: [{
    name: 'vn-opgg-bot',
    script: 'src/bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    // Monitoring
    monitoring: true,
    pmx: false,
    // Instance configuration
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Advanced settings
    node_args: '--max-old-space-size=1024',
    // Health checks
    health_check_grace_period: 3000,
    // Cluster mode (if needed later)
    exec_mode: 'fork'
  }]
};