# 📎 Sistema de Archivos Adjuntos - Índice de Documentación

## 🚨 ¿Tienes el error "row-level security policy"?

**→ Lee primero:** [FIX_ERROR_RLS_RAPIDO.md](./FIX_ERROR_RLS_RAPIDO.md) ⚡

---

## 📚 Documentación Disponible

### 🆘 Solución de Problemas (Empieza aquí si hay errores)

1. **[FIX_ERROR_RLS_RAPIDO.md](./FIX_ERROR_RLS_RAPIDO.md)** ⚡
   - Solución rápida en 2 minutos
   - Para el error más común de RLS
   - Dos opciones: Bucket público o Políticas

2. **[GUIA_VISUAL_POLITICAS_RLS.md](./GUIA_VISUAL_POLITICAS_RLS.md)** 👁️
   - Guía paso a paso con "capturas" textuales
   - Muestra exactamente dónde hacer clic
   - Incluye verificación y tests

3. **[SOLUCION_ERROR_RLS_STORAGE.md](./SOLUCION_ERROR_RLS_STORAGE.md)** 🔧
   - Troubleshooting completo
   - Debugging avanzado
   - Checklist de verificación
   - Solución de último recurso

---

### 📖 Instalación y Configuración

4. **[INSTALACION_ARCHIVOS_CHAT.md](./INSTALACION_ARCHIVOS_CHAT.md)** 🚀
   - Guía de instalación completa
   - SQL para migración de base de datos
   - Configuración de Storage
   - Troubleshooting integrado

---

### 📘 Documentación Técnica

5. **[CHAT_ARCHIVOS_ADJUNTOS.md](./CHAT_ARCHIVOS_ADJUNTOS.md)** 📋
   - Documentación completa de la funcionalidad
   - API del hook useChat
   - Estructura de base de datos
   - Guía para desarrolladores
   - Roadmap de mejoras futuras

6. **[RESUMEN_ARCHIVOS_CHAT.md](./RESUMEN_ARCHIVOS_CHAT.md)** 📊
   - Resumen técnico de implementación
   - Archivos creados/modificados
   - Estructura de datos
   - Flujo de funcionamiento
   - Métricas de éxito

---

### 🛠️ Herramientas

7. **[verificar-storage.js](./verificar-storage.js)** 🔬
   - Script de diagnóstico automático
   - Ejecutar en consola del navegador
   - Verifica autenticación, bucket, políticas
   - Tests de subida/lectura/descarga

8. **[setup-chat-storage.js](./setup-chat-storage.js)** ⚙️
   - Script para crear bucket
   - Muestra políticas RLS necesarias
   - Configuración automática

---

### 🗄️ SQL y Migraciones

9. **[supabase/migrations/20260203_add_message_attachments.sql](./supabase/migrations/20260203_add_message_attachments.sql)**
   - Migración de base de datos
   - Agrega columnas para archivos adjuntos
   - Crea tabla message_attachments
   - Políticas RLS para tablas

---

## 🎯 Flujo Recomendado

### Si estás instalando por primera vez:
```
1. INSTALACION_ARCHIVOS_CHAT.md
2. Ejecutar migración SQL
3. Configurar Storage
4. Probar en la app
```

### Si tienes el error de RLS:
```
1. FIX_ERROR_RLS_RAPIDO.md (Solución en 2 min)
2. Si no funciona → GUIA_VISUAL_POLITICAS_RLS.md
3. Si sigue sin funcionar → SOLUCION_ERROR_RLS_STORAGE.md
4. Ejecutar verificar-storage.js en consola
```

### Si eres desarrollador:
```
1. RESUMEN_ARCHIVOS_CHAT.md (Overview técnico)
2. CHAT_ARCHIVOS_ADJUNTOS.md (Documentación completa)
3. Revisar código en src/hooks/useChat.ts y src/components/Chat.tsx
```

---

## 🔑 Conceptos Clave

### ¿Qué es RLS?
**Row Level Security** - Sistema de seguridad de Supabase que controla quién puede leer/escribir datos.

### ¿Qué es un Bucket?
Contenedor de almacenamiento en Supabase Storage, como una carpeta en la nube.

### ¿Qué es una Política?
Regla SQL que define permisos de acceso (quién puede INSERT, SELECT, UPDATE, DELETE).

---

## ⚡ Soluciones Rápidas por Error

| Error | Solución Rápida | Documento |
|-------|-----------------|-----------|
| "row-level security policy" | Marca bucket como público | FIX_ERROR_RLS_RAPIDO.md |
| "Bucket not found" | Crear bucket 'chat-files' | INSTALACION_ARCHIVOS_CHAT.md |
| "403 Forbidden" | Revisar políticas RLS | GUIA_VISUAL_POLITICAS_RLS.md |
| "Archivo muy grande" | Límite es 50MB | CHAT_ARCHIVOS_ADJUNTOS.md |
| "Tipo no permitido" | Revisar MIME types | INSTALACION_ARCHIVOS_CHAT.md |

---

## 📞 ¿Necesitas Ayuda?

1. **Primero:** Ejecuta `verificar-storage.js` en la consola
2. **Luego:** Revisa el error específico en la tabla de arriba
3. **Finalmente:** Lee el documento correspondiente

---

## ✅ Checklist de Instalación

- [ ] Ejecuté la migración SQL
- [ ] Creé el bucket `chat-files`
- [ ] Configuré las políticas RLS (o marqué como público)
- [ ] Probé subir un archivo
- [ ] Veo el archivo en el chat
- [ ] No hay errores en la consola

---

**Última actualización:** 3 de febrero de 2026  
**Estado:** ✅ Sistema completamente funcional
