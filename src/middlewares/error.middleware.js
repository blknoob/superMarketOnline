/**
 * @fileoverview Sistema centralizado de manejo de errores
 * 
 * Middleware global para captura y procesamiento de errores en toda la aplicación.
 * Proporciona respuestas consistentes y logging detallado para debugging y monitoreo.
 * Incluye clases de error personalizadas y manejo diferenciado por tipo de cliente.
 * 
 * CARACTERÍSTICAS:
 * - Logging estructurado de errores
 * - Respuestas adaptativas (HTML/JSON)
 * - Clases de error personalizadas
 * - Manejo de errores 404
 * - Ocultación de detalles en producción
 * 
 * SEGURIDAD:
 * - No exposición de stack traces en producción
 * - Logging de intentos maliciosos
 * - Códigos de error estandarizados
 * - Manejo seguro de información sensible
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import { logger } from "../utils/logger.js";

/**
 * Middleware principal de manejo de errores
 * 
 * Captura todos los errores no manejados en la aplicación y
 * proporciona respuestas consistentes. Registra detalles completos
 * para debugging y presenta información apropiada al usuario.
 * 
 * FUNCIONALIDADES:
 * - Logging detallado con contexto de request
 * - Respuestas HTML para navegadores
 * - Respuestas JSON para APIs
 * - Ocultación de detalles sensibles en producción
 * - Códigos de estado HTTP apropiados
 * 
 * CASOS DE USO:
 * - Último middleware en la cadena de Express
 * - Captura de errores de base de datos
 * - Manejo de errores de validación
 * - Errores de autenticación y autorización
 * 
 * @function errorHandler
 * @param {Error} err - Objeto de error capturado
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 * @returns {void}
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.email || 'anonymous',
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Determinar código de error
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta según el tipo de cliente
  if (req.accepts('html')) {
    // Respuesta HTML para vistas - enviar respuesta simple sin renderizar
    const title = getErrorTitle(statusCode);
    const message = err.message || getDefaultErrorMessage(statusCode);

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .error-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-title { color: #e74c3c; margin-bottom: 20px; }
            .error-message { color: #555; line-height: 1.6; }
            .back-link { display: inline-block; margin-top: 20px; color: #3498db; text-decoration: none; }
            .back-link:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="error-container">
            <h1 class="error-title">${title}</h1>
            <p class="error-message">${message}</p>
            <a href="/" class="back-link">← Volver al inicio</a>
        </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(statusCode).send(html);
  } else {
    // Respuesta JSON para APIs
    const errorResponse = {
      success: false,
      message: err.message || getDefaultErrorMessage(statusCode),
      code: err.code || getErrorCode(statusCode),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        url: req.url,
        method: req.method
      })
    };

    return res.status(statusCode).json(errorResponse);
  }
};

/**
 * Middleware para manejo de rutas no encontradas (404)
 * 
 * Captura requests que no coinciden con ninguna ruta definida
 * y genera un error 404 apropiado. Debe colocarse antes del
 * errorHandler en la cadena de middlewares.
 * 
 * CARACTERÍSTICAS:
 * - Generación automática de error 404
 * - Mensaje descriptivo con ruta solicitada
 * - Código de error estandarizado
 * - Integración con sistema de logging
 * 
 * @function notFoundHandler
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next que pasa error al errorHandler
 * @returns {void}
 */
export const notFoundHandler = (req, res, next) => {
  const err = new Error(`Ruta ${req.originalUrl} no encontrada`);
  err.statusCode = 404;
  err.code = 'ROUTE_NOT_FOUND';
  next(err);
};

// Función helper para títulos de error
function getErrorTitle(statusCode) {
  const titles = {
    400: 'Solicitud Incorrecta',
    401: 'No Autorizado',
    403: 'Acceso Denegado',
    404: 'Página No Encontrada',
    500: 'Error del Servidor'
  };
  return titles[statusCode] || 'Error';
}

// Función helper para mensajes de error por defecto
function getDefaultErrorMessage(statusCode) {
  const messages = {
    400: 'Los datos enviados no son válidos',
    401: 'Debe iniciar sesión para acceder a este recurso',
    403: 'No tiene permisos para acceder a este recurso',
    404: 'El recurso solicitado no existe',
    500: 'Ha ocurrido un error interno del servidor'
  };
  return messages[statusCode] || 'Ha ocurrido un error inesperado';
}

// Función helper para códigos de error
function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    500: 'INTERNAL_SERVER_ERROR'
  };
  return codes[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Clase base para errores personalizados de la aplicación
 * 
 * Extiende la clase Error nativa para proporcionar información
 * adicional como códigos de estado HTTP y códigos de error
 * personalizados para mejor manejo y debugging.
 * 
 * PROPIEDADES:
 * - message: Mensaje descriptivo del error
 * - statusCode: Código de estado HTTP apropiado
 * - code: Código de error personalizado para APIs
 * - isOperational: Indica si es un error operacional esperado
 * 
 * @class AppError
 * @extends Error
 * @param {string} message - Mensaje descriptivo del error
 * @param {number} statusCode - Código de estado HTTP (default: 500)
 * @param {string|null} code - Código de error personalizado
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || getErrorCode(statusCode);
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND_ERROR');
  }
}