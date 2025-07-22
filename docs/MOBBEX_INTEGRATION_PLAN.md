# Plan de Integración con Mobbex

## 📋 Resumen
Mobbex es una plataforma de pagos argentina que ofrece una API simple y confiable para procesar pagos con tarjetas de crédito/débito, transferencias bancarias y pagos en efectivo.

## 🎯 Objetivos
1. Implementar checkout con Mobbex para reemplazar MercadoPago
2. Soportar múltiples métodos de pago argentinos
3. Mantener la estructura existente de órdenes
4. Implementar webhooks para notificaciones de pago

## 📚 Documentación de Mobbex
- **API Docs**: https://docs.mobbex.com/
- **Panel de Control**: https://mobbex.com/
- **Sandbox**: https://sandbox.mobbex.com/

## 🔧 Plan de Implementación

### Fase 1: Configuración Inicial
1. **Crear cuenta en Mobbex**
   - Registrarse en https://mobbex.com/
   - Obtener credenciales de API (API Key y Access Token)
   - Configurar webhook URL en el panel

2. **Instalar SDK**
   ```bash
   npm install mobbex
   ```

3. **Variables de entorno**
   ```env
   MOBBEX_API_KEY=tu_api_key
   MOBBEX_ACCESS_TOKEN=tu_access_token
   MOBBEX_WEBHOOK_SECRET=tu_webhook_secret
   ```

### Fase 2: Estructura de Archivos
```
src/
├── controllers/
│   └── mobbexController.js      # Controlador principal
├── routes/
│   └── mobbexRoutes.js          # Rutas de Mobbex
├── services/
│   └── mobbexService.js         # Lógica de negocio
└── utils/
    └── mobbexWebhook.js         # Validación de webhooks
```

### Fase 3: Endpoints a Implementar

#### 1. Crear Checkout
```
POST /api/mobbex/checkout
```
- Crear checkout con datos de la orden
- Retornar URL de pago

#### 2. Webhook de Notificaciones
```
POST /api/mobbex/webhook
```
- Recibir notificaciones de Mobbex
- Actualizar estado de órdenes
- Marcar artworks como vendidos

#### 3. Verificar Estado de Pago
```
GET /api/mobbex/status/:checkoutId
```
- Consultar estado de un pago específico

### Fase 4: Flujo de Pago

1. **Cliente inicia compra**
   - Frontend envía datos del carrito
   - Backend crea orden en estado "pending"

2. **Crear checkout en Mobbex**
   ```javascript
   const checkout = {
     total: order.total,
     currency: 'ARS',
     reference: order.orderNumber,
     description: `Orden ${order.orderNumber}`,
     return_url: `${FRONTEND_URL}/payment/success`,
     webhook: `${BACKEND_URL}/api/mobbex/webhook`,
     customer: {
       email: order.customer.email,
       name: order.customer.name,
       identification: order.customer.dni
     },
     items: order.items.map(item => ({
       description: item.title,
       total: item.price
     }))
   };
   ```

3. **Usuario completa pago**
   - Redirección a Mobbex
   - Usuario paga con método preferido
   - Mobbex redirige de vuelta

4. **Actualización via Webhook**
   - Mobbex notifica el resultado
   - Backend actualiza orden
   - Marca artworks como vendidos

### Fase 5: Seguridad

1. **Validación de Webhooks**
   - Verificar firma HMAC
   - Validar origen de IP (opcional)
   - Procesar solo una vez

2. **Manejo de Estados**
   - approved → paid
   - rejected → failed
   - pending → pending

### Fase 6: Testing

1. **Credenciales de Sandbox**
   - Usar ambiente de pruebas
   - Tarjetas de test provistas por Mobbex

2. **Casos de Prueba**
   - Pago exitoso
   - Pago rechazado
   - Timeout/abandono
   - Webhook duplicado

## 📊 Ventajas de Mobbex

1. **Métodos de Pago**
   - Todas las tarjetas argentinas
   - Transferencias bancarias
   - Pagos en efectivo (Rapipago, Pago Fácil)
   - Billeteras virtuales

2. **Características**
   - API simple y bien documentada
   - Dashboard intuitivo
   - Soporte local en español
   - Tarifas competitivas

3. **Integración Rápida**
   - SDK oficial para Node.js
   - Ejemplos de código
   - Sandbox completo

## 🚀 Próximos Pasos

1. Crear cuenta en Mobbex
2. Obtener credenciales de API
3. Implementar controlador básico
4. Probar en sandbox
5. Configurar producción

## 📝 Notas Adicionales

- Mobbex soporta split payments (útil para marketplaces)
- Permite guardar tarjetas tokenizadas
- Tiene sistema de suscripciones recurrentes
- Ofrece checkout embebido o redirect