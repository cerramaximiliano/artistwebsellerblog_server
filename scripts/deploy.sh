#!/bin/bash

# Script de deployment para el servidor de producción
# Uso: ./scripts/deploy.sh

echo "🚀 Iniciando deployment de Artist Web Seller Blog API..."

# Variables
APP_NAME="artistwebseller-api-prod"
APP_DIR="/var/www/artistwebsellerblog_server"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Error: No se encuentra package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# 1. Pull últimos cambios
print_status "Obteniendo últimos cambios de Git..."
git pull origin main
if [ $? -ne 0 ]; then
    print_error "Error al hacer git pull"
    exit 1
fi

# 2. Instalar/actualizar dependencias
print_status "Instalando dependencias..."
npm ci --production
if [ $? -ne 0 ]; then
    print_error "Error al instalar dependencias"
    exit 1
fi

# 3. Verificar archivo .env
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    print_warning "Por favor, configura las variables de entorno en .env"
fi

# 4. Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p logs
mkdir -p /var/log/pm2

# 5. Detener aplicación existente (si está corriendo)
print_status "Verificando si la aplicación está corriendo..."
pm2 describe $APP_NAME > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_warning "Deteniendo aplicación existente..."
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# 6. Iniciar aplicación con PM2
print_status "Iniciando aplicación con PM2..."
pm2 start ecosystem.production.config.js

# 7. Guardar configuración de PM2
print_status "Guardando configuración de PM2..."
pm2 save

# 8. Configurar PM2 para inicio automático
print_status "Configurando inicio automático..."
pm2 startup systemd -u $USER --hp $HOME

# 9. Mostrar estado
print_status "Estado de la aplicación:"
pm2 status

echo ""
print_status "¡Deployment completado exitosamente! 🎉"
echo ""
echo "Comandos útiles:"
echo "  pm2 status          - Ver estado de la aplicación"
echo "  pm2 logs            - Ver logs en tiempo real"
echo "  pm2 monit           - Monitor interactivo"
echo "  pm2 restart $APP_NAME - Reiniciar aplicación"
echo ""