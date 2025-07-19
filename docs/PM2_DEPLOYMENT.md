# PM2 Deployment Guide

## Configuración PM2 para Producción

Este proyecto incluye configuración PM2 en modo **fork** (instancia única) optimizada para servidores de producción.

## Archivos de Configuración

### 1. `ecosystem.config.js` (Desarrollo)
- Configuración básica para desarrollo local
- Logs en carpeta `./logs/`

### 2. `ecosystem.production.config.js` (Producción)
- Configuración optimizada para servidor
- Logs en `/var/log/pm2/`
- Límite de memoria: 1GB
- Reinicio automático

## Instalación en Servidor

### 1. Instalar PM2 globalmente
```bash
npm install -g pm2
```

### 2. Clonar repositorio
```bash
cd /var/www
git clone https://github.com/tu-usuario/artistwebsellerblog_server.git
cd artistwebsellerblog_server
```

### 3. Instalar dependencias
```bash
npm ci --production
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar con tus valores
```

### 5. Ejecutar script de deployment
```bash
npm run deploy
```

## Comandos PM2

### Iniciar aplicación
```bash
# Desarrollo
npm run pm2:start

# Producción
npm run pm2:start:prod
```

### Gestión
```bash
# Ver estado
pm2 status

# Ver logs
npm run pm2:logs
# o
pm2 logs artistwebseller-api-prod --lines 100

# Reiniciar
npm run pm2:restart

# Detener
npm2:stop

# Monitor en tiempo real
npm run pm2:monit
```

### Comandos avanzados
```bash
# Recargar sin downtime
pm2 reload artistwebseller-api-prod

# Ver información detallada
pm2 describe artistwebseller-api-prod

# Ver métricas
pm2 show artistwebseller-api-prod

# Flush logs
pm2 flush

# Actualizar PM2
pm2 update
```

## Configuración de Logs

Los logs se guardan en:
- **Desarrollo**: `./logs/`
- **Producción**: `/var/log/pm2/`

### Rotación de logs (opcional)
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Monitoreo

### PM2 Web Dashboard (opcional)
```bash
pm2 web
```
Accesible en: http://localhost:9615

### PM2 Plus (monitoreo remoto)
```bash
pm2 plus
```

## Inicio Automático

El script de deploy configura PM2 para iniciar automáticamente al reiniciar el servidor:

```bash
pm2 startup
pm2 save
```

## Troubleshooting

### La aplicación no inicia
1. Verificar logs: `pm2 logs`
2. Verificar .env: `cat .env`
3. Verificar permisos: `ls -la`

### Memoria alta
```bash
# Ver uso de memoria
pm2 monit

# Reiniciar si usa más de 1GB (configurado)
pm2 restart artistwebseller-api-prod
```

### Puerto en uso
```bash
# Ver qué usa el puerto
sudo lsof -i :5010

# Matar proceso
kill -9 <PID>
```

## Actualización de la Aplicación

```bash
# 1. Pull cambios
git pull origin main

# 2. Instalar nuevas dependencias
npm ci --production

# 3. Recargar sin downtime
pm2 reload artistwebseller-api-prod

# O usar el script
npm run deploy
```

## Seguridad

1. **Nunca** commitear `.env`
2. Usar usuario no-root para PM2
3. Configurar firewall para puerto 5010
4. Usar NGINX como reverse proxy

## NGINX Configuration (ejemplo)

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:5010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```