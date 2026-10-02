/**
 * SISTEMA DE LOGGING AVANZADO - AUDITORÍA Y MONITOREO
 * 
 * Sistema de logging robusto basado en Winston con rotación diaria
 * Implementa estándares OWASP para logging de seguridad y auditoría
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - Rotación automática de archivos por fecha
 * - Múltiples canales especializados por tipo de evento
 * - Compresión automática de logs antiguos
 * - Retención diferenciada por importancia
 * - Formatos optimizados para análisis
 * 
 * CANALES DE LOGGING:
 * - error: Errores críticos del sistema (30 días)
 * - security: Eventos de seguridad (90 días)
 * - app: Logs generales de aplicación (14 días)
 * - access: Requests HTTP para auditoría (30 días)
 * - console: Salida de consola en desarrollo
 * 
 * COMPLIANCE OWASP:
 * - Logging de eventos de seguridad críticos
 * - Auditoría de intentos de autenticación
 * - Monitoreo de rate limiting
 * - Registro de errores de validación
 * - Trazabilidad de operaciones de negocio
 * 
 * FUNCIONALIDADES DE SEGURIDAD:
 * - Logs de eventos críticos con alta retención
 * - Timestamps precisos para auditoría
 * - Metadata completa (IP, User-Agent, Usuario)
 * - Rotación y compresión automática
 * 
 * INTEGRACIÓN DEL SISTEMA:
 * - Middleware de logging HTTP
 * - Funciones especializadas por tipo de evento
 * - Helpers para diferentes dominios del sistema
 * - Configuración por variables de entorno
 */
import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CONFIGURACIÓN DE DIRECTORIO DE LOGS
 * 
 * Creación automática del directorio de logs si no existe
 * Estructura organizada para diferentes tipos de archivos
 */
// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * NIVELES DE LOG PERSONALIZADOS
 * 
 * Definición de jerarquía de severidad y colores
 * Optimizados para diferentes tipos de eventos del sistema
 * 
 * JERARQUÍA:
 * 0. error (crítico): Errores que requieren atención inmediata
 * 1. warn (advertencia): Eventos sospechosos o anormales
 * 2. info (informativo): Operaciones normales del sistema
 * 3. http (acceso): Requests HTTP y métricas de acceso
 * 4. debug (depuración): Información detallada para desarrollo
 */
// Definir niveles de log personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Configuración de transports con rotación diaria
const transports = [
  // Log de errores con rotación diaria (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '30d', // Mantener logs por 30 días
    zippedArchive: true
  }),

  // Log de seguridad para eventos críticos (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '90d', // Mantener logs de seguridad por 90 días
    zippedArchive: true
  }),

  // Log general con rotación diaria
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: customFormat,
    maxSize: '50m',
    maxFiles: '14d', // Mantener logs generales por 14 días
    zippedArchive: true
  }),

  // Log HTTP requests para auditoría (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Formato específico para logs de acceso
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta
        });
      })
    ),
    maxSize: '100m',
    maxFiles: '30d',
    zippedArchive: true
  })
];

// Agregar console transport en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      )
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// Agregar colores a winston
winston.addColors(customLevels.colors);

// Función helper para logging HTTP requests
export const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

// Función helper para logging de errores de base de datos
export const logDatabaseError = (operation, collection, error) => {
  logger.error(`Database Error - ${operation} on ${collection}`, {
    operation,
    collection,
    error: error.message,
    stack: error.stack
  });
};

// Función helper para logging de operaciones de negocio
export const logBusinessOperation = (operation, data, user = null) => {
  logger.info(`Business Operation: ${operation}`, {
    operation,
    user: user?.email || 'anonymous',
    data
  });
};

/**
 * LOGGING DE EVENTOS DE SEGURIDAD CRÍTICOS - OWASP COMPLIANCE
 * 
 * Registra eventos de seguridad que requieren atención especial
 * Implementa estándares OWASP para logging de seguridad
 * 
 * @param {string} event - Tipo de evento de seguridad
 * @param {Object} details - Detalles específicos del evento
 * @param {Object|null} req - Request de Express para contexto
 * 
 * EVENTOS TÍPICOS:
 * - Intentos de acceso no autorizado
 * - Inyecciones SQL detectadas
 * - Múltiples intentos de login fallidos
 * - Acceso a recursos prohibidos
 * - Manipulación de parámetros sospechosa
 * 
 * METADATA DE SEGURIDAD:
 * - IP y User-Agent del atacante
 * - URL y método de la request
 * - Usuario involucrado (si aplica)
 * - Timestamp preciso del evento
 * - Severidad marcada como HIGH
 * 
 * RETENCIÓN: 90 días para cumplimiento de auditoría
 */
// OWASP - Logging de eventos de seguridad críticos
export const logSecurityEvent = (event, details, req = null) => {
  const securityLog = {
    event,
    timestamp: new Date().toISOString(),
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent'),
    url: req?.originalUrl,
    method: req?.method,
    user: req?.user?.email || 'anonymous',
    details,
    severity: 'HIGH'
  };

  logger.warn(`SECURITY EVENT: ${event}`, securityLog);
};

/**
 * LOGGING DE INTENTOS DE AUTENTICACIÓN - OWASP COMPLIANCE
 * 
 * Registra todos los intentos de autenticación para auditoría
 * Diferencia entre intentos exitosos y fallidos
 * 
 * @param {string} type - Tipo de autenticación (login, register, password_reset)
 * @param {string} email - Email del usuario intentando autenticarse
 * @param {boolean} success - Si el intento fue exitoso
 * @param {Object} req - Request de Express
 * @param {string|null} reason - Razón específica de fallo
 * 
 * TIPOS DE AUTENTICACIÓN:
 * - login: Inicio de sesión regular
 * - register: Registro de nueva cuenta
 * - password_reset: Restablecimiento de contraseña
 * - change_password: Cambio de contraseña
 * - admin_login: Acceso administrativo
 * 
 * RAZONES DE FALLO:
 * - invalid_credentials: Credenciales incorrectas
 * - account_locked: Cuenta bloqueada
 * - email_not_found: Email no existe
 * - weak_password: Contraseña no cumple políticas
 * 
 * UTILIDAD FORENSE:
 * - Detectar ataques de fuerza bruta
 * - Identificar patrones sospechosos
 * - Auditoría de accesos
 * - Compliance normativo
 */
// OWASP - Logging de intentos de autenticación
export const logAuthAttempt = (type, email, success, req, reason = null) => {
  const authLog = {
    type, // 'login', 'register', 'password_reset', etc.
    email,
    success,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
    reason: reason || (success ? 'valid_credentials' : 'invalid_credentials')
  };

  if (success) {
    logger.info(`AUTH SUCCESS: ${type}`, authLog);
  } else {
    logger.warn(`AUTH FAILURE: ${type}`, authLog);
  }
};

/**
 * LOGGING DE RATE LIMITING - OWASP COMPLIANCE
 * 
 * Registra cuando se activa el rate limiting por exceso de requests
 * Ayuda a identificar ataques DDoS o uso abusivo
 * 
 * @param {string} ip - Dirección IP bloqueada
 * @param {string} endpoint - Endpoint que activó el rate limit
 * @param {number} limit - Límite de requests configurado
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @param {Object|null} req - Request de Express
 * 
 * INFORMACIÓN REGISTRADA:
 * - IP del cliente bloqueado
 * - Endpoint específico afectado
 * - Parámetros de rate limiting aplicados
 * - User-Agent para identificación
 * - Timestamp del bloqueo
 * 
 * CASOS DE USO:
 * - Detectar ataques automatizados
 * - Identificar bots maliciosos
 * - Monitorear efectividad de rate limits
 * - Ajustar políticas de protección
 */
// OWASP - Logging de rate limiting
export const logRateLimit = (ip, endpoint, limit, windowMs, req = null) => {
  const rateLimitLog = {
    ip,
    endpoint,
    limit,
    windowMs,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
    blocked: true
  };

  logger.warn('RATE LIMIT EXCEEDED', rateLimitLog);
};

/**
 * LOGGING DE ERRORES DE VALIDACIÓN - OWASP COMPLIANCE
 * 
 * Registra intentos de envío de datos inválidos o maliciosos
 * Ayuda a detectar intentos de inyección y manipulación
 * 
 * @param {string} field - Campo que falló la validación
 * @param {any} value - Valor que causó el error (truncado por seguridad)
 * @param {Error} error - Error de validación capturado
 * @param {Object|null} req - Request de Express
 * 
 * TIPOS DE VALIDACIÓN:
 * - Formato de datos (email, teléfono)
 * - Longitud de campos
 * - Caracteres prohibidos
 * - Patrones sospechosos (inyecciones)
 * - Tipos de dato incorrectos
 * 
 * SEGURIDAD:
 * - Trunca valores largos para evitar logs masivos
 * - No expone datos sensibles completos
 * - Incluye contexto de IP y URL
 * - Timestamp para correlación temporal
 * 
 * UTILIDAD:
 * - Detectar intentos de inyección SQL/NoSQL
 * - Identificar payloads maliciosos
 * - Monitorear calidad de datos
 * - Debugging de validaciones
 */
// OWASP - Logging de validación de entrada
export const logValidationError = (field, value, error, req = null) => {
  const validationLog = {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value, // Truncar valores largos
    error: error.message,
    ip: req?.ip,
    url: req?.originalUrl,
    timestamp: new Date().toISOString()
  };

  logger.warn('VALIDATION ERROR', validationLog);
};