# Sistema de Cola Compartida para Proveedores

## Cambios Implementados

### 1. **Modificación en la creación de conversaciones**
**Archivo:** `src/pages/ContactPage.tsx`

- **Antes:** Al crear una conversación, se asignaba automáticamente un `provider_id` de la lista de proveedores disponibles
- **Ahora:** Las conversaciones se crean con `provider_id: null` (sin asignar)

### 2. **Actualización del filtro de conversaciones**
**Archivo:** `src/hooks/useChat.ts` - función `loadConversations()`

- **Antes:** Los proveedores solo veían conversaciones asignadas a ellos: `provider_id.eq.${user.id}`
- **Ahora:** Los proveedores ven:
  - Conversaciones sin asignar: `provider_id IS NULL`
  - Conversaciones asignadas a ellos: `provider_id = su_id`
  - Query: `.or(\`provider_id.is.null,provider_id.eq.${user.id}\`)`

### 3. **Asignación automática al responder**
**Archivo:** `src/hooks/useChat.ts` - función `sendMessage()`

- **Nueva funcionalidad:** Cuando un proveedor envía un mensaje a una conversación sin asignar:
  1. Verifica si la conversación tiene `provider_id = null`
  2. Si es así, actualiza `provider_id` con el ID del proveedor que responde
  3. La conversación queda asignada permanentemente a ese proveedor

### 4. **Indicador visual de conversaciones sin asignar**
**Archivo:** `src/components/ConversationsList.tsx`

- **Nuevo badge:** Las conversaciones sin asignar muestran un badge amarillo "Sin asignar"
- Aparece junto al nombre del producto para que los proveedores identifiquen rápidamente qué conversaciones están disponibles

### 5. **Actualización de todas las llamadas a sendMessage**
**Archivo:** `src/components/Chat.tsx`

- Todas las llamadas a `sendMessage()` ahora incluyen el perfil del usuario como 4to parámetro
- Esto permite que la función verifique si el usuario es proveedor y asigne la conversación

### 6. **Desactivación del trigger automático**
**Archivo:** `supabase/disable-auto-assign-provider.sql`

- Se eliminó el trigger `auto_assign_provider_trigger` que asignaba automáticamente proveedores al crear conversaciones
- Se eliminó la función `auto_assign_provider()` asociada

## Flujo de Trabajo

### Cliente crea conversación:
1. Cliente inicia conversación desde la página de contacto
2. Se crea registro en `conversations` con:
   - `customer_id`: ID del cliente
   - `product_id`: ID del producto consultado
   - `provider_id`: **NULL** (sin asignar)
   - `status`: 'active'

### Proveedores ven la conversación:
1. **Todos** los proveedores ven la nueva conversación en su lista
2. Aparece con el badge "Sin asignar" en color amarillo
3. Pueden ver:
   - Nombre del producto
   - Nombre del cliente
   - Email del cliente

### Proveedor toma la conversación:
1. Proveedor abre el chat
2. Escribe y envía un mensaje
3. **Automáticamente:**
   - La función `sendMessage()` detecta que es un proveedor
   - Verifica que `provider_id IS NULL`
   - Actualiza `provider_id` con el ID del proveedor
   - El badge "Sin asignar" desaparece
4. La conversación ya no aparece en la lista de otros proveedores (solo en la del asignado)

## Ventajas del Sistema

✅ **Distribución equitativa:** Todos los proveedores ven las mismas conversaciones nuevas

✅ **Asignación por disponibilidad:** El primer proveedor que responde se queda con la conversación

✅ **Sin intervención manual:** No requiere asignar manualmente desde un panel admin

✅ **Indicador visual claro:** Los proveedores identifican fácilmente conversaciones disponibles

✅ **Permanencia:** Una vez asignada, la conversación permanece con ese proveedor

## Archivos Modificados

```
src/
├── components/
│   ├── Chat.tsx (actualizado: agregar profile a sendMessage)
│   └── ConversationsList.tsx (actualizado: badge "Sin asignar")
├── hooks/
│   └── useChat.ts (actualizado: filtros y asignación automática)
└── pages/
    └── ContactPage.tsx (actualizado: provider_id = null)

supabase/
└── disable-auto-assign-provider.sql (nuevo: eliminar trigger)
```

## Próximos Pasos

Para aplicar los cambios en producción:

1. Ejecutar la migración SQL:
```bash
node -e "const { createClient } = require('@supabase/supabase-js'); ..."
```

2. Verificar que el trigger se eliminó:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_assign_provider_trigger';
```

3. Probar el flujo completo:
   - Cliente crea conversación
   - Proveedor 1 y Proveedor 2 ven la conversación
   - Proveedor 1 responde primero
   - Conversación se asigna a Proveedor 1
   - Proveedor 2 ya no la ve en su lista
