module.exports = {
  apps: [{
    // Configuración de la aplicación
    name: 'artistwebseller-api',
    script: './src/app.js',
    
    // Modo fork (single instance)
    instances: 1,
    exec_mode: 'fork',
    
    // Configuración de entorno
    env: {
      NODE_ENV: 'development',
      PORT: 5010
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5010
    },
    
    // Configuración de logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    
    // Configuración de reinicio
    max_restarts: 10,
    min_uptime: '10s',
    
    // Watch & Ignore (desactivado en producción)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git',
      '*.log',
      '.env'
    ],
    
    // Configuración de memoria
    max_memory_restart: '500M',
    
    // Auto restart
    autorestart: true,
    
    // Configuración adicional
    merge_logs: true,
    kill_timeout: 3000,
    listen_timeout: 3000,
    
    // Variables de entorno desde archivo
    env_file: '.env'
  }],

  // Configuración de deploy (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/artistwebsellerblog_server.git',
      path: '/var/www/artistwebseller-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};