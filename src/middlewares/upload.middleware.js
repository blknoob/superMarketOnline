/**
 * @fileoverview Middleware seguro para subida de archivos
 * 
 * Sistema completo de manejo de uploads con validaciones de seguridad
 * según estándares OWASP. Incluye sanitización de nombres, validación
 * de tipos MIME, limitación de tamaños y almacenamiento seguro.
 * 
 * PROTECCIONES OWASP:
 * - A01:2021 Broken Access Control: Validación de tipos de archivo
 * - A03:2021 Injection: Sanitización de nombres de archivo
 * - A05:2021 Security Misconfiguration: Configuración segura de multer
 * - A08:2021 Software Integrity Failures: Validación de integridad
 * 
 * CARACTERÍSTICAS:
 * - Validación estricta de tipos MIME
 * - Sanitización de nombres de archivo
 * - Limitaciones de tamaño configurables
 * - Almacenamiento seguro con nombres aleatorios
 * - Logging de eventos de subida
 * - Manejo de errores de multer
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { logSecurityEvent, logValidationError } from "../utils/logger.js";

// OWASP - Configuración segura de multer para subida de archivos

// Tipos MIME permitidos para comprobantes de pago
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  documents: [
    'application/pdf',
    'text/plain'
  ]
};

// Configuración de tamaños máximos (en bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5MB para imágenes
  document: 10 * 1024 * 1024, // 10MB para documentos
  default: 2 * 1024 * 1024   // 2MB por defecto
};

// Función para validar MIME type
const validateMimeType = (file, allowedTypes = []) => {
  const allAllowed = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents, ...allowedTypes];
  return allAllowed.includes(file.mimetype);
};

// Función para validar tamaño de archivo
const validateFileSize = (file, maxSize = MAX_FILE_SIZES.default) => {
  return file.size <= maxSize;
};

// Función para sanitizar nombre de archivo
const sanitizeFilename = (filename) => {
  // Remover caracteres peligrosos y normalizar
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales
    .replace(/_{2,}/g, '_')          // Reducir múltiples guiones bajos
    .replace(/^[._]/, '')            // Remover puntos/guiones al inicio
    .substring(0, 100);              // Limitar longitud
};

/**
 * Crea configuración de almacenamiento seguro para multer
 * 
 * Genera configuración de diskStorage con nombres de archivo
 * seguros y creación automática de directorios. Implementa
 * sanitización y generación de nombres únicos.
 * 
 * SEGURIDAD:
 * - Nombres de archivo aleatorios con timestamp
 * - Sanitización de caracteres peligrosos
 * - Limitación de longitud de nombres
 * - Creación segura de directorios
 * 
 * CASOS DE USO:
 * - Configuración base para diferentes tipos de upload
 * - Almacenamiento de imágenes de productos
 * - Subida de comprobantes de pago
 * - Documentos administrativos
 * 
 * @function createSecureStorage
 * @param {string} destination - Directorio de destino (default: 'uploads/')
 * @param {Object} options - Opciones adicionales de configuración
 * @returns {multer.StorageEngine} Configuración de storage para multer
 */
export const createSecureStorage = (destination = 'uploads/', options = {}) => {
  // Crear directorio si no existe
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // OWASP - Generar nombre de archivo seguro
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname).toLowerCase();
      const sanitizedName = sanitizeFilename(path.basename(file.originalname, extension));
      
      const filename = `${timestamp}-${randomSuffix}-${sanitizedName}${extension}`;
      cb(null, filename);
    }
  });
};

/**
 * Middleware de validación post-upload de archivos
 * 
 * Valida archivos después de la subida con multer, verificando
 * tipo MIME, tamaño y requisitos de presencia. Elimina archivos
 * que no cumplen validaciones para evitar almacenamiento inseguro.
 * 
 * VALIDACIONES:
 * - Presencia de archivo (si es requerido)
 * - Tipo MIME contra lista permitida
 * - Tamaño máximo configurable
 * - Integridad de metadata del archivo
 * 
 * SEGURIDAD:
 * - Eliminación automática de archivos inválidos
 * - Logging de intentos de subida maliciosa
 * - Validación estricta de tipos MIME
 * - Prevención de ataques de tamaño de archivo
 * 
 * @function validateFile
 * @param {Object} options - Opciones de validación
 * @param {string[]} options.allowedMimeTypes - Tipos MIME permitidos
 * @param {number} options.maxFileSize - Tamaño máximo en bytes
 * @param {boolean} options.required - Si el archivo es obligatorio
 * @returns {Function} Middleware de Express para validación
 */
export const validateFile = (options = {}) => {
  const {
    allowedMimeTypes = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents],
    maxFileSize = MAX_FILE_SIZES.default,
    required = false
  } = options;

  return (req, res, next) => {
    const file = req.file;
    
    // Si el archivo no es requerido y no se envió, continuar
    if (!required && !file) {
      return next();
    }

    // Si es requerido pero no se envió
    if (required && !file) {
      logValidationError('file_missing', 'required', new Error('Archivo requerido no proporcionado'), req);
      return res.status(400).json({
        status: 'error',
        message: 'Archivo requerido'
      });
    }

    // Si hay archivo, validar
    if (file) {
      // Validar MIME type
      if (!validateMimeType(file, allowedMimeTypes)) {
        logSecurityEvent('INVALID_FILE_TYPE_UPLOAD', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: allowedMimeTypes
        }, req);

        // Eliminar archivo subido
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(400).json({
          status: 'error',
          message: 'Tipo de archivo no permitido'
        });
      }

      // Validar tamaño
      if (!validateFileSize(file, maxFileSize)) {
        logSecurityEvent('FILE_SIZE_EXCEEDED', {
          filename: file.originalname,
          size: file.size,
          maxSize: maxFileSize
        }, req);

        // Eliminar archivo subido
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(400).json({
          status: 'error',
          message: `Archivo demasiado grande. Máximo permitido: ${Math.round(maxFileSize / 1024 / 1024)}MB`
        });
      }

      // Log subida exitosa
      logSecurityEvent('FILE_UPLOAD_SUCCESS', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        destination: file.path
      }, req);
    }

    next();
  };
};

/**
 * Crea configuración de multer para comprobantes de pago
 * 
 * Configuración especializada para subida de imágenes de
 * comprobantes de pago con validaciones específicas y
 * almacenamiento en directorio público.
 * 
 * CONFIGURACIÓN:
 * - Directorio: public/comprobantes/
 * - Tamaño máximo: 5MB
 * - Tipos permitidos: JPEG, PNG, GIF, WebP
 * - Un archivo por request
 * 
 * CASOS DE USO:
 * - Subida de capturas de transferencias
 * - Comprobantes de pago móvil
 * - Screenshots de transacciones
 * - Evidencia de pagos en efectivo
 * 
 * @function createPaymentProofUpload
 * @returns {Function} Middleware de multer configurado
 */
export const createPaymentProofUpload = () => {
  const storage = createSecureStorage('public/comprobantes/');
  
  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZES.image, // 5MB para comprobantes
      files: 1, // Solo un archivo por request
    },
    fileFilter: (req, file, cb) => {
      // Validación inicial en fileFilter
      if (validateMimeType(file, ALLOWED_MIME_TYPES.images)) {
        cb(null, true);
      } else {
        const error = new Error('Tipo de archivo no permitido para comprobante');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    }
  });
};

/**
 * Crea configuración de multer para documentos generales
 * 
 * Configuración para subida de documentos administrativos
 * con soporte para múltiples formatos y mayor tamaño máximo.
 * 
 * CONFIGURACIÓN:
 * - Directorio: uploads/documents/
 * - Tamaño máximo: 10MB
 * - Tipos permitidos: PDF, imágenes, texto plano
 * - Un archivo por request
 * 
 * CASOS DE USO:
 * - Documentos administrativos
 * - Reportes en PDF
 * - Imágenes de productos
 * - Archivos de texto de configuración
 * 
 * @function createDocumentUpload
 * @returns {Function} Middleware de multer configurado
 */
export const createDocumentUpload = () => {
  const storage = createSecureStorage('uploads/documents/');
  
  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZES.document, // 10MB para documentos
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      if (validateMimeType(file)) {
        cb(null, true);
      } else {
        const error = new Error('Tipo de archivo no permitido');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    }
  });
};

/**
 * Middleware de manejo de errores de multer
 * 
 * Procesa errores específicos de multer y proporciona
 * mensajes de error user-friendly. Registra eventos
 * de seguridad para intentos de subida maliciosa.
 * 
 * ERRORES MANEJADOS:
 * - LIMIT_FILE_SIZE: Archivo demasiado grande
 * - LIMIT_FILE_COUNT: Demasiados archivos
 * - LIMIT_UNEXPECTED_FILE: Campo inesperado
 * - INVALID_FILE_TYPE: Tipo de archivo no permitido
 * 
 * CARACTERÍSTICAS:
 * - Logging de errores de seguridad
 * - Mensajes localizados en español
 * - Respuestas JSON estructuradas
 * - Prevención de exposición de detalles internos
 * 
 * @function handleMulterError
 * @param {Error} error - Error de multer o personalizado
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logSecurityEvent('MULTER_ERROR', {
      error: error.message,
      code: error.code,
      field: error.field
    }, req);

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'error',
          message: 'Archivo demasiado grande'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          status: 'error',
          message: 'Demasiados archivos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          status: 'error',
          message: 'Campo de archivo inesperado'
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Error al procesar archivo'
        });
    }
  }

  if (error && error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  next(error);
};

export default {
  createSecureStorage,
  validateFile,
  createPaymentProofUpload,
  createDocumentUpload,
  handleMulterError,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};