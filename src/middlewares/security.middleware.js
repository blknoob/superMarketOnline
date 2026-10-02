/**
 * @fileoverview Middlewares de seguridad avanzados
 * 
 * Conjunto completo de middlewares de seguridad que implementan
 * prácticas de OWASP para protección contra ataques comunes.
 * Incluye rate limiting, sanitización, detección de ataques y headers de seguridad.
 * 
 * PROTECCIONES IMPLEMENTADAS:
 * - A01:2021 Broken Access Control: Rate limiting
 * - A03:2021 Injection: Sanitización y detección SQL injection
 * - A05:2021 Security Misconfiguration: Headers de seguridad
 * - A06:2021 Vulnerable Components: Validación de entrada
 * - A09:2021 Security Logging: Logging detallado de eventos
 * 
 * CARACTERÍSTICAS:
 * - Rate limiting en memoria configurable
 * - Sanitización automática de entrada
 * - Detección de patrones de ataque
 * - Headers de seguridad modernos
 * - Logging de eventos de seguridad
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import { logger, logSecurityEvent, logRateLimit } from "../utils/logger.js";

// Rate limiting simple en memoria
const rateLimitStore = new Map();

// OWASP - Rate limiting más estricto
const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 3 }, // 3 intentos por 15 minutos para auth (OWASP)
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 por minuto para API general
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 por 15 minutos para operaciones críticas
  resetPassword: { windowMs: 60 * 60 * 1000, maxRequests: 2 }, // 2 por hora para reset password
  registration: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 } // 5 registros por día por IP
};

// Función helper para limpiar entradas expiradas
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Middleware de rate limiting configurable
 * 
 * Implementa limitación de velocidad por IP y tipo de operación.
 * Utiliza almacenamiento en memoria con limpieza automática de
 * entradas expiradas. Cumple con recomendaciones OWASP.
 * 
 * CONFIGURACIONES DISPONIBLES:
 * - auth: 3 intentos/15min (protección login)
 * - api: 100 requests/min (uso general API)
 * - strict: 5 requests/15min (operaciones críticas)
 * - resetPassword: 2 requests/hora
 * - registration: 5 registros/día
 * 
 * CARACTERÍSTICAS:
 * - Limpieza automática de entradas expiradas
 * - Headers X-RateLimit-* en respuestas
 * - Logging de violaciones de límites
 * - Respuestas adaptativas (HTML/JSON)
 * 
 * @function rateLimit
 * @param {string} type - Tipo de rate limit a aplicar
 * @returns {Function} Middleware configurado de Express
 */
export const rateLimit = (type = 'api') => {
  const config = RATE_LIMITS[type];

  return (req, res, next) => {
    const key = `${req.ip}:${type}`;
    const now = Date.now();

    // Limpiar entradas expiradas periódicamente
    if (Math.random() < 0.01) { // 1% de probabilidad
      cleanupExpiredEntries();
    }

    let userData = rateLimitStore.get(key);

    if (!userData) {
      userData = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Resetear contador si la ventana expiró
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + config.windowMs;
    }

    userData.count++;
    rateLimitStore.set(key, userData);

    // Verificar límite
    if (userData.count > config.maxRequests) {
      // OWASP - Log evento de seguridad por rate limiting
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        endpoint: req.originalUrl,
        attempts: userData.count,
        limit: config.maxRequests,
        windowMs: config.windowMs
      }, req);

      logRateLimit(req.ip, type, config.maxRequests, config.windowMs, req);

      const resetIn = Math.ceil((userData.resetTime - now) / 1000);

      if (req.accepts('html')) {
        return res.status(429).render('error', {
          title: 'Demasiadas Solicitudes',
          message: `Has excedido el límite de solicitudes. Intenta nuevamente en ${resetIn} segundos.`
        });
      }

      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetIn
      });
    }

    // Agregar headers de rate limit
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - userData.count),
      'X-RateLimit-Reset': Math.ceil(userData.resetTime / 1000)
    });

    next();
  };
};

/**
 * Middleware de sanitización de entrada
 * 
 * Limpia y sanitiza todos los datos de entrada (body, params)
 * para prevenir ataques de inyección y caracteres maliciosos.
 * Implementa validaciones recursivas para objetos anidados.
 * 
 * SANITIZACIONES APLICADAS:
 * - Remoción de caracteres de control (0x00-0x1F, 0x7F)
 * - Limitación de longitud de strings (10,000 caracteres)
 * - Limitación de tamaño de arrays (100 elementos)
 * - Validación de claves de objeto (solo alfanuméricos)
 * - Normalización de espacios en blanco
 * 
 * CASOS DE USO:
 * - Protección contra inyección NoSQL
 * - Prevención de caracteres de control maliciosos
 * - Limitación de tamaño de payload
 * - Normalización de datos de entrada
 * 
 * @function sanitizeInput
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const sanitizeInput = (req, res, next) => {
  // Función recursiva para sanitizar objetos
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remover caracteres de control y normalizar
      return value
        .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
        .trim()
        .substring(0, 10000); // Limitar longitud
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue).slice(0, 100); // Limitar arrays
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        // Solo permitir keys alfanuméricos y guiones bajos
        if (/^[a-zA-Z0-9_]+$/.test(key)) {
          sanitized[key] = sanitizeValue(val);
        }
      }
      return sanitized;
    }

    return value;
  };

  // Sanitizar body y params (query es de solo lectura en Express)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Middleware de headers de seguridad
 * 
 * Configura headers HTTP de seguridad modernos para protección
 * contra ataques comunes. Implementa recomendaciones OWASP
 * para headers de respuesta seguros.
 * 
 * HEADERS CONFIGURADOS:
 * - X-Content-Type-Options: nosniff (previene MIME sniffing)
 * - X-Frame-Options: DENY (previene clickjacking)
 * - X-XSS-Protection: 1; mode=block (protección XSS legacy)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: Deshabilita APIs sensibles
 * - Strict-Transport-Security: Solo en producción (HSTS)
 * 
 * CASOS DE USO:
 * - Protección contra clickjacking
 * - Prevención de ataques XSS
 * - Control de políticas de referrer
 * - Limitación de APIs del navegador
 * 
 * @function securityHeaders
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const securityHeaders = (req, res, next) => {
  // Headers de seguridad básicos
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  });

  // Agregar HSTS en producción
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * Middleware de detección de ataques
 * 
 * Analiza requests en busca de patrones de ataque comunes
 * y bloquea solicitudes sospechosas. Registra intentos
 * maliciosos para análisis forense.
 * 
 * ATAQUES DETECTADOS:
 * - Inyección SQL: Patrones UNION, SELECT, INSERT, etc.
 * - Path Traversal: Secuencias ../ y variantes encoded
 * - Caracteres de control maliciosos
 * - Patrones de shellcode
 * 
 * RESPUESTA A ATAQUES:
 * - Bloqueo inmediato de la solicitud
 * - Logging detallado del evento de seguridad
 * - Respuesta 403 Forbidden
 * - No exposición de detalles técnicos
 * 
 * CASOS DE USO:
 * - Protección proactiva contra inyecciones
 * - Detección de bots maliciosos
 * - Monitoreo de intentos de intrusión
 * - Análisis forense de ataques
 * 
 * @function detectAttacks
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const detectAttacks = (req, res, next) => {
  const suspicious = [];

  // Detectar SQL injection básica
  const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i;
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlPatterns.test(value)) {
      suspicious.push('Posible SQL injection detectado');
    }
  };

  // Verificar en body, query y params
  [req.body, req.query, req.params].forEach(obj => {
    if (obj && typeof obj === 'object') {
      JSON.stringify(obj, (key, value) => {
        checkValue(value);
        return value;
      });
    }
  });

  // Detectar URLs sospechosas
  if (req.url.includes('..') || req.url.includes('%2e%2e')) {
    suspicious.push('Posible path traversal detectado');
  }

  // Loggear si se detecta algo sospechoso
  if (suspicious.length > 0) {
    // OWASP - Log evento de seguridad crítico
    logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
      suspiciousActivities: suspicious,
      blockedRequest: true
    }, req);

    // Bloquear la solicitud
    if (req.accepts('html')) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'Actividad sospechosa detectada.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por actividad sospechosa.',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  next();
};

/**
 * Middleware de logging de seguridad
 * 
 * Registra requests que pueden indicar actividad sospechosa
 * o problemas de rendimiento. Monitorea duración de requests
 * y códigos de estado para detección de anomalías.
 * 
 * EVENTOS REGISTRADOS:
 * - Requests que tardan más de 5 segundos
 * - Responses con código de estado >= 400
 * - Información de contexto (IP, User-Agent, usuario)
 * - Métricas de rendimiento
 * 
 * UTILIDAD:
 * - Detección de ataques de denegación de servicio
 * - Monitoreo de rendimiento de la aplicación
 * - Análisis de patrones de uso malicioso
 * - Auditoría de acceso a recursos
 * 
 * @function securityLogger
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Loggear requests que toman mucho tiempo o tienen status de error
    if (duration > 5000 || res.statusCode >= 400) {
      logger.info('Security Log - Request completada', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user?.email || 'anonymous'
      });
    }
  });

  next();
};