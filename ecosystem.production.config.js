module.exports = {
  apps: [{
    // Nombre de la aplicación en PM2
    name: 'artistwebseller-api-prod',
    
    // Script principal
    script: './src/app.js',
    
    // Directorio de trabajo
    cwd: '/var/www/artistwebsellerblog_server',
    
    // Modo fork para una sola instancia
    instances: 1,
    exec_mode: 'fork',
    
    // Variables de entorno de producción
    env: {
      NODE_ENV: 'production',
      PORT: 5010
    },
    
    // Logs con rotación
    error_file: '/var/log/pm2/artistwebseller-error.log',
    out_file: '/var/log/pm2/artistwebseller-out.log',
    log_file: '/var/log/pm2/artistwebseller-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de reinicio automático
    max_restarts: 10,
    min_uptime: '30s',
    max_memory_restart: '1G',
    autorestart: true,
    
    // No watch en producción
    watch: false,
    
    // Configuración adicional
    merge_logs: true,
    kill_timeout: 5000,
    listen_timeout: 5000,
    
    // Manejo de señales
    shutdown_with_message: true,
    wait_ready: true,
    
    // Variables de entorno desde archivo
    env_file: '.env',
    
    // Node.js args
    node_args: '--max-old-space-size=1024',
    
    // Interpreter args
    interpreter_args: '',
    
    // Configuración de instancia
    instance_var: 'INSTANCE_ID',
    
    // Source map support
    source_map_support: true
  }]
};