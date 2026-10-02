/**
 * @fileoverview Validación y configuración de variables de entorno
 * 
 * Sistema robusto de validación de variables de entorno basado en Joi.
 * Implementa validaciones de seguridad según estándares OWASP:
 * - Longitud mínima para secretos
 * - Formatos seguros para URLs y emails
 * - Patrones de contraseñas robustas
 * - Validación de puertos y URIs
 * - Verificaciones adicionales por ambiente
 * 
 * SEGURIDAD OWASP:
 * - A02:2021 Cryptographic Failures: Secretos con longitud mínima
 * - A05:2021 Security Misconfiguration: Validación de configuración
 * - A07:2021 Identification and Authentication Failures: Contraseñas robustas
 * 
 * CARACTERÍSTICAS:
 * - Validación estricta con Joi
 * - Mensajes de error descriptivos
 * - Warnings de seguridad para producción
 * - Logging estructurado de validación
 * - Terminación controlada en caso de error
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import Joi from 'joi';
import { logger } from '../utils/logger.js';

// OWASP - Esquema de validación para variables de entorno
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(8080),
  
  MONGO_URI: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'MONGO_URI is required in environment variables',
      'string.uri': 'MONGO_URI must be a valid MongoDB connection string'
    }),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_SECRET is required in environment variables',
      'string.min': 'JWT_SECRET must be at least 32 characters long for security'
    }),
  
  COOKIE_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'COOKIE_SECRET is required in environment variables',
      'string.min': 'COOKIE_SECRET must be at least 32 characters long for security'
    }),
  
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'SESSION_SECRET is required in environment variables',
      'string.min': 'SESSION_SECRET must be at least 32 characters long for security'
    }),
  
  ADMIN_EMAIL: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'ADMIN_EMAIL is required in environment variables',
      'string.email': 'ADMIN_EMAIL must be a valid email address'
    }),
  
  ADMIN_PASSWORD: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'any.required': 'ADMIN_PASSWORD is required in environment variables',
      'string.min': 'ADMIN_PASSWORD must be at least 8 characters long',
      'string.pattern.base': 'ADMIN_PASSWORD must contain uppercase, lowercase, number and special character'
    }),
  
  EMAIL_USER: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'EMAIL_USER is required in environment variables',
      'string.email': 'EMAIL_USER must be a valid email address'
    }),
  
  EMAIL_PASS: Joi.string()
    .min(8)
    .required()
    .messages({
      'any.required': 'EMAIL_PASS is required in environment variables',
      'string.min': 'EMAIL_PASS must be at least 8 characters long'
    }),
  
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:8080')
    .messages({
      'string.uri': 'FRONTEND_URL must be a valid URL'
    }),
  
  // Opcionales para producción
  REDIS_URL: Joi.string()
    .uri()
    .optional(),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  SENTRY_DSN: Joi.string()
    .uri()
    .optional()
}).unknown();

/**
 * Valida todas las variables de entorno requeridas para la aplicación
 * 
 * Ejecuta validación completa utilizando el schema Joi definido,
 * incluyendo verificaciones adicionales de seguridad específicas
 * para ambiente de producción.
 * 
 * VALIDACIONES PRINCIPALES:
 * - Formato y longitud de secretos JWT/Cookie/Session
 * - Validación de URLs y emails
 * - Patrones de contraseñas seguras
 * - Configuración de puertos válidos
 * - URIs de conexión MongoDB
 * 
 * VERIFICACIONES DE SEGURIDAD:
 * - Longitud de secretos en producción (64+ caracteres)
 * - URLs sin localhost en producción
 * - SSL habilitado para MongoDB en producción
 * - Nivel de logging apropiado
 * 
 * COMPORTAMIENTO:
 * - Termina proceso con exit(1) si hay errores críticos
 * - Registra warnings para configuraciones inseguras
 * - Logging detallado del proceso de validación
 * - Retorna objeto con variables validadas
 * 
 * @function validateEnvVars
 * @returns {Object} Variables de entorno validadas y normalizadas
 * @throws {ProcessExit} Termina proceso si validación falla
 * 
 * CASOS DE USO:
 * - Inicialización de aplicación
 * - Verificación de configuración en CI/CD
 * - Validación antes de deploy
 * - Setup de contenedores
 */
export const validateEnvVars = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.error('Environment validation failed', {
      errors: errorMessages,
      NODE_ENV: process.env.NODE_ENV
    });
    
    console.error('❌ Environment validation failed:');
    console.error(errorMessages.join('\n'));
    console.error('\n💡 Check your .env file and ensure all required variables are set.');
    console.error('📋 Use .env.example as a template.');
    
    process.exit(1);
  }
  
  // Verificaciones adicionales de seguridad
  const warnings = [];
  
  // Verificar que no se usen valores por defecto inseguros
  if (value.JWT_SECRET.length < 64 && value.NODE_ENV === 'production') {
    warnings.push('JWT_SECRET should be at least 64 characters in production');
  }
  
  if (value.NODE_ENV === 'production' && value.FRONTEND_URL.includes('localhost')) {
    warnings.push('FRONTEND_URL should not contain localhost in production');
  }
  
  if (value.NODE_ENV === 'production' && !value.MONGO_URI.includes('ssl=true')) {
    warnings.push('MONGO_URI should use SSL in production');
  }
  
  if (warnings.length > 0) {
    logger.warn('Environment security warnings', { warnings });
    console.warn('⚠️  Security warnings:');
    console.warn(warnings.join('\n'));
  }
  
  logger.info('Environment validation passed', {
    NODE_ENV: value.NODE_ENV,
    PORT: value.PORT,
    hasMongoURI: !!value.MONGO_URI,
    hasSecrets: !!value.JWT_SECRET
  });
  
  console.log('✅ Environment variables validated successfully');
  
  return value;
};

export default validateEnvVars;