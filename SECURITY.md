# 🛡️ Seguridad - SuperMercado Online

## Mejoras de Seguridad OWASP Implementadas

### ✅ 1. Autenticación y Gestión de Sesiones
- **JWT Secrets seguros**: Tokens de 32 bytes criptográficamente seguros
- **Cookies seguras**: httpOnly, sameSite: 'strict', secure en producción
- **Logging de autenticación**: Registro de todos los intentos de login/registro
- **Validación robusta**: Joi validation con reglas de complejidad de contraseñas

### ✅ 2. Control de Acceso
- **Rate Limiting**: 3 intentos por 15 minutos para autenticación
- **Rate Limiting API**: 100 requests por minuto para API general
- **Middleware de autenticación**: Verificación de tokens en rutas protegidas
- **Roles y permisos**: Sistema de roles admin/user implementado

### ✅ 3. Validación de Entrada
- **Joi Validation**: Validación completa de schemas de entrada
- **Sanitización**: Limpieza automática de datos peligrosos
- **Validación MIME**: Control estricto de tipos de archivos
- **Límites de tamaño**: Archivos limitados a 5-10MB según tipo

### ✅ 4. Headers de Seguridad (Helmet.js)
- **Content Security Policy (CSP)**: Protección contra XSS
- **HSTS**: Strict Transport Security con 1 año de duración
- **X-Frame-Options**: Protección contra clickjacking
- **X-Content-Type-Options**: Prevención de MIME sniffing
- **Referrer Policy**: Control de información de referrer

### ✅ 5. Logging y Monitoreo
- **Winston con rotación**: Logs diarios con compresión automática
- **Logs de seguridad**: Eventos críticos en archivos separados
- **Retención de logs**: 30-90 días según criticidad
- **Structured logging**: Formato JSON para análisis automático

### ✅ 6. Manejo Seguro de Archivos
- **Validación MIME**: Solo tipos permitidos (imágenes, PDF)
- **Sanitización de nombres**: Limpieza de caracteres peligrosos
- **Límites de tamaño**: Control estricto de tamaños de archivo
- **Storage seguro**: Archivos fuera del directorio web

### ✅ 7. Variables de Entorno
- **Validación al inicio**: Verificación de todas las variables críticas
- **Secrets seguros**: Mínimo 32 caracteres para secretos
- **Advertencias**: Alertas por configuraciones inseguras
- **Ejemplo actualizado**: .env.example con valores seguros

### ✅ 8. Docker Security
- **Usuario no privilegiado**: Contenedor ejecuta como user 1001
- **Sistema de archivos read-only**: Solo directorios necesarios con escritura
- **Límites de recursos**: CPU y memoria limitados
- **Health checks**: Monitoreo de estado del contenedor
- **Network isolation**: Red privada para servicios

### ✅ 9. Detección de Ataques
- **Patrones maliciosos**: Detección de SQL injection, XSS, path traversal
- **Logging de intentos**: Registro de actividad sospechosa
- **Bloqueo automático**: Respuesta a patrones de ataque
- **Alertas de seguridad**: Logs específicos para eventos críticos

### ✅ 10. CORS y Configuración
- **CORS restrictivo**: Whitelist de dominios permitidos
- **Flexibilidad en desarrollo**: Configuración adaptable por entorno
- **Credentials**: Manejo seguro de cookies cross-origin
- **Headers expuestos**: Solo información necesaria

## 🚀 Configuración de Producción

### Variables de Entorno Requeridas
```bash
# Servidor
NODE_ENV=production
PORT=8080

# Base de datos
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database

# Seguridad (usar valores seguros de 32+ caracteres)
JWT_SECRET=<32-byte-secure-random-string>
COOKIE_SECRET=<32-byte-secure-random-string>
SESSION_SECRET=<32-byte-secure-random-string>

# Administrador
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=<password-fuerte>

# Email
EMAIL_USER=<email-configurado>
EMAIL_PASS=<app-password>
FRONTEND_URL=https://dominio.com
```

### Generación de Secrets Seguros
```bash
# Generar secretos seguros de 32 bytes
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Despliegue Docker
```bash
# Construir imagen segura
docker build -t supermercado-online .

# Ejecutar con docker-compose
docker-compose up -d

# Verificar health checks
docker-compose ps
```

## 🔍 Monitoreo y Logs

### Estructura de Logs
```
logs/
├── error-YYYY-MM-DD.log      # Errores críticos
├── security-YYYY-MM-DD.log   # Eventos de seguridad
├── access-YYYY-MM-DD.log     # Logs de acceso HTTP
└── app-YYYY-MM-DD.log        # Logs generales
```

### Eventos de Seguridad Monitoreados
- Intentos de login fallidos
- Rate limiting activado
- Archivos maliciosos detectados
- Patrones de ataque identificados
- Accesos no autorizados

## ⚠️ Consideraciones Adicionales

### Para Producción
1. **Certificados SSL**: Configurar HTTPS con certificados válidos
2. **WAF**: Implementar Web Application Firewall
3. **Backup**: Configurar backups automáticos de base de datos
4. **Monitoreo**: Implementar alertas por logs de seguridad
5. **Auditoría**: Revisiones regulares de logs y accesos

### Mantenimiento
- Actualizar dependencias regularmente: `npm audit`
- Revisar logs de seguridad semanalmente
- Rotar secrets cada 3-6 meses
- Auditar permisos de usuarios trimestralmente

## 📊 Testing de Seguridad

### Comandos útiles
```bash
# Auditoría de dependencias
npm audit

# Test de rate limiting
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Verificar headers de seguridad
curl -I http://localhost:8080
```

---

**✅ Todas las mejoras de seguridad OWASP Top 10 han sido implementadas correctamente.**