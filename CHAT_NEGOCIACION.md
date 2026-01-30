# Sistema de Chat y Negociación tipo Alibaba

Este sistema implementa un chat de negociación entre compradores y proveedores similar al de Alibaba.

## 🎯 Características Principales

### 1. **Chat en Tiempo Real**
- Mensajes instantáneos usando Pusher
- Soporte para texto y productos compartidos
- Historial completo de conversaciones

### 2. **Envío de Productos desde el Carrito**
- Cuando el usuario hace clic en "Contact Provider" desde el carrito:
  - Se crea o encuentra una conversación con el proveedor
  - Se envía automáticamente la lista de productos con cantidades y precios
  - El usuario puede empezar a negociar inmediatamente

### 3. **Botones de Negociación Rápida**
El chat incluye mensajes predefinidos para agilizar la comunicación:
- "¿Puede hacer un mejor precio?"
- "¿Tiene disponibilidad inmediata?"
- "¿Cuánto cuesta el envío?"
- "¿Acepta pedidos personalizados?"

### 4. **Compartir Productos en el Chat**
- Los productos se pueden compartir con información visual
- Incluye imagen, nombre, cantidad y precio
- Soporte para proponer precios alternativos

### 5. **Contraoferta de Precios**
- Los compradores pueden hacer contraofertas sobre productos
- Los proveedores pueden aceptar o hacer nuevas ofertas
- Interfaz simple para negociar precios

### 6. **Cotizaciones Formales**
Los proveedores pueden crear cotizaciones que incluyen:
- Lista detallada de productos
- Precios unitarios y totales
- Costo de envío negociable
- **Descuentos** para cerrar negociaciones
- **Notas especiales** (plazos, condiciones, términos)
- Link de pago de PayPal
- Estados: pending, sent, paid

## 🚀 Flujo de Negociación

```
1. Cliente agrega productos al carrito
   ↓
2. Cliente hace clic en "Contact Provider"
   ↓
3. Se abre el chat con lista de productos
   ↓
4. Cliente usa mensajes rápidos o escribe libremente
   ↓
5. Negociación de precios y envío
   ↓
6. Proveedor crea cotización formal
   ↓
7. Cliente acepta y paga
```

## 💡 Cómo Usar

### Para Compradores:
1. Agrega productos a tu carrito
2. Haz clic en **"Contact Provider"**
3. Usa los botones de mensajes rápidos o escribe tu mensaje
4. Propón precios alternativos si lo deseas
5. Revisa las cotizaciones en el panel lateral

### Para Proveedores:
1. Responde a los mensajes de los clientes
2. Haz clic en **"Crear Cotización"** para formalizar
3. Agrega productos, precios, costos de envío
4. **Ofrece descuentos** para incentivar la compra
5. Agrega **notas** con condiciones especiales
6. Envía la cotización con link de pago

## 🎨 Componentes Creados

- **ProductShareCard**: Muestra productos compartidos con opciones de negociación
- **QuickMessageButtons**: Botones de mensajes predefinidos
- **CreateQuote**: Formulario mejorado con descuentos y notas
- **Chat mejorado**: Soporte para productos y contraofertas

## 🔧 Mejoras Futuras Sugeridas

1. **Notificaciones push** cuando llega un mensaje
2. **Historial de precios** para cada producto
3. **Exportar cotizaciones** a PDF
4. **Multimoneda** para negociaciones internacionales
5. **Traducción automática** de mensajes
6. **Calculadora de envío** integrada
7. **Sistema de reputación** para proveedores
8. **Verificación de identidad** de proveedores

## 📝 Notas Técnicas

- Los productos se envían como JSON en los mensajes
- Las cotizaciones se almacenan en la tabla `quotes`
- El chat usa Supabase Realtime + Pusher para tiempo real
- Los precios se pueden negociar sin límites

---

**¡El sistema está listo para negociar como en Alibaba!** 🎉
