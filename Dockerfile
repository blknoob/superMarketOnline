# OWASP - Dockerfile seguro para aplicación Node.js

# 1. Usar imagen oficial con tag específico (no latest)
FROM node:20.18.0-alpine3.20

# 2. Actualizar el sistema y agregar herramientas de seguridad
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# 3. Crear usuario no privilegiado
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# 4. Establecer directorio de trabajo
WORKDIR /app

# 5. Cambiar ownership del directorio de trabajo
RUN chown -R appuser:nodejs /app

# 6. Copiar solo archivos de dependencias primero (para cache de layers)
COPY --chown=appuser:nodejs package*.json ./

# 7. Cambiar a usuario no privilegiado antes de instalar dependencias
USER appuser

# 8. Instalar solo dependencias de producción y limpiar cache
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# 9. Copiar código de aplicación con ownership correcto
COPY --chown=appuser:nodejs . .

# 10. OWASP - Variables de entorno de seguridad
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# 11. OWASP - Crear directorio para logs con permisos correctos
RUN mkdir -p logs uploads/documents public/comprobantes public/images && \
    chmod 755 logs uploads uploads/documents public public/comprobantes public/images

# 12. Exponer solo puerto necesario
EXPOSE 8080

# 13. OWASP - Usar dumb-init como PID 1 para manejo correcto de señales
# y ejecutar como usuario no privilegiado
ENTRYPOINT ["dumb-init", "--"]

# 14. Comando de aplicación con usuario no privilegiado
CMD ["node", "src/server.js"]

# OWASP - Metadatos de seguridad
LABEL maintainer="SuperMercado Online <admin@supermercado.com>" \
      version="1.0.0" \
      description="Aplicación segura de supermercado online" \
      security.non-root-user="appuser" \
      security.vulnerability-scan="required"

# 15. OWASP - Configurar límites de recursos (si el orchestrator lo soporta)
# Nota: Docker Compose o Kubernetes debería configurar limits adicionales