# Implementación de MercadoPago - Backend

## Resumen de la Implementación

Se ha implementado la integración completa con MercadoPago para el procesamiento de pagos en el backend.

### Archivos Creados/Modificados

1. **Controladores**:
   - `src/controllers/checkoutController.js` - Nuevo controlador para checkout con MercadoPago
   - `src/controllers/paymentController.js` - Actualizado para mejorar integración

2. **Rutas**:
   - `src/routes/checkoutRoutes.js` - Rutas de checkout
   - `src/routes/webhookRoutes.js` - Webhooks para MercadoPago y Stripe

3. **Modelos**:
   - `src/models/Order.js` - Actualizado con campos para MercadoPago

4. **Configuración**:
   - `.env.example` - Actualizado con variables de MercadoPago
   - `src/app.js` - Agregadas nuevas rutas

## Endpoints Disponibles

### 1. Crear Preferencia de Pago
```
POST /api/checkout/create-preference
```

**Body:**
```json
{
  "items": [{
    "id": "artwork_id",
    "title": "Título de la obra",
    "price": 1000,
    "currency": "ARS",
    "description": "Descripción opcional"
  }],
  "customer": {
    "firstName": "Nombre",
    "lastName": "Apellido",
    "email": "email@example.com",
    "phone": "1234567890",
    "dni": "12345678"
  },
  "shipping": {
    "method": "delivery", // "pickup", "delivery", "shipping"
    "address": "Calle 123",
    "city": "Ciudad",
    "province": "Provincia",
    "postalCode": "1234",
    "notes": "Notas opcionales"
  },
  "billing": {
    "type": "consumer", // "consumer" o "business"
    "businessName": "Nombre empresa (si es business)",
    "cuit": "20-12345678-9"
  },
  "total": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "preference_id",
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/...",
    "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/...",
    "orderId": "order_id",
    "orderNumber": "ORD-202412-0001"
  }
}
```

### 2. Webhook de MercadoPago
```
POST /api/webhook/mercadopago
```

Este endpoint recibe las notificaciones de MercadoPago y actualiza el estado de las órdenes automáticamente.

### 3. Verificar Estado de Pago
```
GET /api/checkout/payment-status/:paymentId
```

## Configuración Requerida

### Variables de Entorno

Agregar en `.env`:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456-123456-abcdef1234567890abcdef1234567890-12345678
MERCADOPAGO_PUBLIC_KEY=APP_USR-12345678-1234-1234-1234-123456789012

# URLs
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://api.tu-dominio.com
```

### Obtener Credenciales

1. Ingresar a [MercadoPago Developers](https://www.mercadopago.com/developers/panel/app)
2. Crear una aplicación o seleccionar una existente
3. Ir a "Credenciales de producción" o "Credenciales de prueba"
4. Copiar el Access Token y Public Key

## Flujo de Pago

1. **Frontend** envía los datos del carrito a `/api/checkout/create-preference`
2. **Backend** crea la preferencia en MercadoPago y guarda la orden
3. **Backend** devuelve el `init_point` (URL de checkout)
4. **Frontend** redirige al usuario a MercadoPago
5. **Usuario** completa el pago en MercadoPago
6. **MercadoPago** envía notificación al webhook
7. **Backend** actualiza el estado de la orden y las obras vendidas

## Estados de Pago

- `approved` - Pago aprobado
- `pending` - Pago pendiente
- `in_process` - Pago en proceso
- `rejected` - Pago rechazado
- `cancelled` - Pago cancelado

## Testing

### Modo Sandbox

Para testing, usar las credenciales de sandbox y el `sandbox_init_point`.

### Tarjetas de Prueba

- **Aprobada**: 5031 7557 3453 0604
- **Rechazada**: 5031 7557 3453 0612
- CVV: 123
- Fecha: Cualquier fecha futura
- DNI: 12345678

## Seguridad

1. **Webhook Signature**: MercadoPago no envía firma, pero siempre verificamos el pago con su API
2. **HTTPS Requerido**: En producción, usar HTTPS para el webhook
3. **Validación**: Siempre validar los datos antes de procesar

## Troubleshooting

### Error "MercadoPago no está configurado"
- Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté en `.env`
- Reiniciar el servidor después de agregar las variables

### Webhook no recibe notificaciones
- Verificar que la URL del webhook sea accesible públicamente
- En desarrollo, usar ngrok o similar
- Configurar la URL en el panel de MercadoPago

### Pago no actualiza la orden
- Verificar logs del webhook
- Comprobar que el `preference_id` coincida
- Revisar el estado del pago en MercadoPago

## Próximos Pasos

1. Implementar envío de emails de confirmación
2. Agregar reporte de ventas
3. Implementar reembolsos
4. Agregar más métodos de envío