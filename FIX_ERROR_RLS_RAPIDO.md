# ⚡ SOLUCIÓN RÁPIDA - Error RLS Storage

## El Error
```
❌ StorageApiError: new row violates row-level security policy
```

## La Solución (2 minutos)

### ✅ OPCIÓN 1: Bucket Público (Más Rápido)

1. Ve a **Supabase Dashboard**
2. **Storage** > **chat-files** > **Configuration**
3. Marca: ☑ **Public bucket**
4. Click **Save**
5. ✅ ¡Listo!

---

### ✅ OPCIÓN 2: Políticas RLS (Más Seguro)

1. Ve a **Storage** > **chat-files** > **Policies**

2. Click **New Policy**:
   - **Operation:** INSERT
   - **Target roles:** authenticated
   - **WITH CHECK:** `bucket_id = 'chat-files'`
   - Save

3. Click **New Policy** otra vez:
   - **Operation:** SELECT
   - **Target roles:** authenticated
   - **USING:** `bucket_id = 'chat-files'`
   - Save

4. ✅ ¡Listo!

---

## 🧪 Verificar que Funciona

Abre la consola del navegador (F12) en tu app y ejecuta:

```javascript
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

const { error } = await supabase.storage
  .from('chat-files')
  .upload(`test-${Date.now()}.txt`, testFile);

console.log(error ? '❌ Error: ' + error.message : '✅ Funciona!');
```

---

## 📚 Más Ayuda

- [GUIA_VISUAL_POLITICAS_RLS.md](./GUIA_VISUAL_POLITICAS_RLS.md) - Guía paso a paso con imágenes
- [SOLUCION_ERROR_RLS_STORAGE.md](./SOLUCION_ERROR_RLS_STORAGE.md) - Troubleshooting completo
- [INSTALACION_ARCHIVOS_CHAT.md](./INSTALACION_ARCHIVOS_CHAT.md) - Instalación completa

---

**¿Cuál opción elegir?**

- 🏃 **Desarrollo/Testing:** Opción 1 (Bucket Público)
- 🔒 **Producción:** Opción 2 (Políticas RLS)
