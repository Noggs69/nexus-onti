# 📸 Guía Visual: Configurar Políticas RLS en Supabase Storage

## Error que verás si las políticas faltan:
```
❌ StorageApiError: new row violates row-level security policy
```

## 🎯 Objetivo
Permitir que usuarios autenticados suban y vean archivos en el bucket `chat-files`.

---

## 📋 Paso a Paso con Capturas Textuales

### Paso 1: Acceder a Policies

```
Supabase Dashboard
└── Storage (menú izquierdo)
    └── chat-files (click en el bucket)
        └── Policies (pestaña superior)
            └── [New Policy] (botón azul)
```

---

### Paso 2: Crear Política INSERT

```
┌─────────────────────────────────────────────────────┐
│ New Policy                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Policy Name:                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ Allow authenticated uploads                 │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Allowed operation:                                  │
│ ☑ INSERT  ☐ SELECT  ☐ UPDATE  ☐ DELETE           │
│                                                     │
│ Target roles:                                       │
│ ☑ authenticated  ☐ anon  ☐ service_role          │
│                                                     │
│ WITH CHECK expression:                              │
│ ┌─────────────────────────────────────────────┐   │
│ │ bucket_id = 'chat-files'                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│          [Review]  [Cancel]                         │
└─────────────────────────────────────────────────────┘
```

**Clic en Review > Save policy**

---

### Paso 3: Crear Política SELECT

```
┌─────────────────────────────────────────────────────┐
│ New Policy                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Policy Name:                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ Allow authenticated reads                   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Allowed operation:                                  │
│ ☐ INSERT  ☑ SELECT  ☐ UPDATE  ☐ DELETE           │
│                                                     │
│ Target roles:                                       │
│ ☑ authenticated  ☐ anon  ☐ service_role          │
│                                                     │
│ USING expression:                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ bucket_id = 'chat-files'                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│          [Review]  [Cancel]                         │
└─────────────────────────────────────────────────────┘
```

**Clic en Review > Save policy**

---

### Resultado Final

Deberías ver estas 2 políticas activas:

```
Storage > chat-files > Policies

┌──────────────────────────────────────────────────────────┐
│ Active Policies (2)                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ✓ Allow authenticated uploads                           │
│   INSERT | authenticated                                │
│   WITH CHECK: bucket_id = 'chat-files'                  │
│   [Edit] [Delete]                                        │
│                                                          │
│ ✓ Allow authenticated reads                             │
│   SELECT | authenticated                                │
│   USING: bucket_id = 'chat-files'                       │
│   [Edit] [Delete]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Verificación Rápida

### Test 1: Subir archivo manualmente
1. Ve a `Storage > chat-files`
2. Clic en `Upload file`
3. Si puedes subir, las políticas funcionan ✓

### Test 2: Probar en la app
```javascript
// Abre consola del navegador (F12)
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

const { data, error } = await supabase.storage
  .from('chat-files')
  .upload('test.txt', testFile);

console.log('Data:', data);    // ✅ Debe mostrar info del archivo
console.log('Error:', error);  // ✅ Debe ser null
```

---

## 🔄 Alternativa: Bucket Público

Si las políticas te causan problemas, usa esta opción más simple:

```
Storage > chat-files > Configuration

┌──────────────────────────────────────────────────────┐
│ Bucket Configuration                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Bucket name: chat-files                             │
│                                                      │
│ ☑ Public bucket                                     │
│   (Allow public access to all files)                │
│                                                      │
│ File size limit: 50 MB                              │
│                                                      │
│          [Save]  [Cancel]                            │
└──────────────────────────────────────────────────────┘
```

**⚠️ Importante:** Con bucket público, cualquiera con la URL puede ver los archivos.

---

## 📊 Comparación de Métodos

| Método | Seguridad | Complejidad | Recomendado Para |
|--------|-----------|-------------|------------------|
| Políticas RLS | 🔒 Alta | 🔧 Media | Producción |
| Bucket Público | ⚠️ Media | ✅ Baja | Desarrollo/Testing |

---

## 🆘 ¿Sigue sin funcionar?

Si después de seguir estos pasos sigues viendo el error:

1. **Verifica que estés autenticado:**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user?.id); // Debe mostrar un UUID
   ```

2. **Elimina todas las políticas y empieza de nuevo:**
   - Storage > chat-files > Policies
   - Elimina todas las políticas existentes
   - Crea solo las 2 políticas de arriba

3. **O simplemente marca el bucket como público:**
   - Es más simple y funciona para empezar
   - Puedes agregar seguridad más adelante

---

**¿Necesitas ayuda adicional?**
- Consulta: [SOLUCION_ERROR_RLS_STORAGE.md](./SOLUCION_ERROR_RLS_STORAGE.md)
- Ejecuta: `verificar-storage.js` en la consola del navegador
