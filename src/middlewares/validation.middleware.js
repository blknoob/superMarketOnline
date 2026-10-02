/**
 * MIDDLEWARE DE VALIDACIÓN PARA SUPERMERCADO ONLINE
 * 
 * Este archivo contiene todas las funciones de validación de datos
 * que se utilizan en las rutas de la API para verificar que los
 * datos recibidos cumplan con los formatos y restricciones esperados.
 * 
 * Incluye validaciones para:
 * - IDs de MongoDB
 * - Datos del carrito de compras
 * - Datos de métodos de pago
 * - Archivos de imagen
 * - Esquemas Joi para validación robusta (OWASP)
 */

import mongoose from "mongoose";
import Joi from 'joi';
import { logger } from '../utils/logger.js';


/**
 * VALIDADOR DE OBJECT ID DE MONGODB
 * 
 * Middleware que valida que un parámetro de la URL sea un ObjectId válido de MongoDB.
 * Se utiliza para proteger rutas que requieren IDs de productos, usuarios, carritos, etc.
 * 
 * @param {string} paramName - Nombre del parámetro en la URL que contiene el ID
 * @returns {Function} Middleware que valida el ObjectId
 * 
 * Ejemplos de uso:
 * - router.get('/products/:id', validateObjectId('id'), getProduct)
 * - router.put('/cart/:cartId', validateObjectId('cartId'), updateCart)
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Error de Validación',
          message: `Parámetro ${paramName} es requerido`
        });
      }
      return res.status(400).json({
        success: false,
        message: `Parámetro ${paramName} es requerido`,
        code: 'MISSING_PARAMETER'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Error de Validación',
          message: `El ID ${paramName} no es válido`
        });
      }
      return res.status(400).json({
        success: false,
        message: `El ID ${paramName} no es válido`,
        code: 'INVALID_OBJECT_ID'
      });
    }

    next();
  };
};

/**
 * VALIDADOR DE DATOS DEL CARRITO
 * 
 * Middleware que valida los datos enviados para operaciones del carrito de compras.
 * Verifica que el ID del producto sea válido y que la cantidad esté en el rango permitido.
 * 
 * Validaciones que realiza:
 * - productId: Debe existir y ser un ObjectId válido
 * - quantity: Debe ser un número entre 0 y 100 (opcional)
 * 
 * Se usa en rutas como:
 * - POST /api/carts/:cid/products (agregar producto al carrito)
 * - PUT /api/carts/:cid/products/:pid (actualizar cantidad)
 */
export const validateCartData = (req, res, next) => {
  const { productId, quantity } = req.body;

  const errors = [];

  if (!productId) {
    errors.push('ID del producto es requerido');
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.push('ID del producto no es válido');
  }

  if (quantity !== undefined) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push('La cantidad debe ser un número positivo');
    }
    if (qty > 100) {
      errors.push('La cantidad máxima permitida es 100');
    }
  }

  if (errors.length > 0) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error de Validación',
        message: errors.join('. ')
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Convertir quantity a número si existe
  if (quantity !== undefined) {
    req.body.quantity = parseInt(quantity);
  }

  next();
};

/**
 * VALIDADOR DE DATOS DE PAGO
 * 
 * Middleware que valida los datos de un método de pago antes de procesar una transacción.
 * Asegura que el método, monto y referencia cumplan con los requisitos del sistema.
 * 
 * Validaciones que realiza:
 * - method: Debe ser 'pago_movil', 'zelle' o 'transfer'
 * - amount: Debe ser un número positivo menor a 10,000
 * - reference: Requerida para todos los métodos excepto 'zelle'
 * 
 * Se usa en rutas de checkout y procesamiento de pagos.
 */
export const validatePaymentData = (req, res, next) => {
  const { method, amount, reference } = req.body;

  const errors = [];
  const allowedMethods = ['pago_movil', 'zelle', 'transfer'];

  if (!method) {
    errors.push('Método de pago es requerido');
  } else if (!allowedMethods.includes(method)) {
    errors.push(`Método de pago debe ser uno de: ${allowedMethods.join(', ')}`);
  }

  if (!amount) {
    errors.push('Monto es requerido');
  } else {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      errors.push('El monto debe ser un número positivo');
    }
    if (amt > 10000) {
      errors.push('El monto máximo permitido es 10,000');
    }
  }

  if (method !== 'zelle' && !reference) {
    errors.push('Referencia de pago es requerida para este método');
  }

  if (errors.length > 0) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error en Datos de Pago',
        message: errors.join('. ')
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Datos de pago inválidos',
      errors,
      code: 'PAYMENT_VALIDATION_ERROR'
    });
  }

  // Convertir amount a número
  req.body.amount = parseFloat(amount);

  next();
};

/**
 * VALIDADOR DE ARCHIVOS DE IMAGEN
 * 
 * Middleware que valida archivos de imagen subidos por los usuarios.
 * Verifica tipo, tamaño y existencia del archivo para operaciones de upload.
 * 
 * Validaciones que realiza:
 * - Existencia: El archivo debe estar presente
 * - Tipo: Solo permite JPEG, PNG, GIF, WebP
 * - Tamaño: Máximo 5MB por archivo
 * 
 * Se usa típicamente después del middleware de multer en rutas como:
 * - POST /api/products (subir imagen de producto)
 * - PUT /api/users/avatar (actualizar avatar de usuario)
 */
export const validateImageFile = (req, res, next) => {
  if (!req.file) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error de Archivo',
        message: 'Se requiere un archivo de imagen'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Se requiere un archivo de imagen',
      code: 'FILE_REQUIRED'
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Tipo de Archivo Inválido',
        message: 'Solo se permiten archivos JPEG, PNG, GIF o WebP'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP',
      code: 'INVALID_FILE_TYPE'
    });
  }

  if (req.file.size > maxSize) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Archivo Demasiado Grande',
        message: 'El archivo no puede superar los 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB permitido',
      code: 'FILE_TOO_LARGE'
    });
  }

  next();
};

/**
 * ESQUEMAS DE VALIDACIÓN JOI (OWASP SECURITY)
 * 
 * Conjunto de esquemas de validación robustos usando la librería Joi.
 * Estos esquemas implementan buenas prácticas de seguridad OWASP para
 * validación de entrada de datos.
 * 
 * Características de seguridad:
 * - Longitud mínima y máxima para prevenir ataques
 * - Patrones regex para formato de datos
 * - Sanitización automática de datos
 * - Validación de tipos de datos estricta
 */
const schemas = {
  /**
   * ESQUEMAS DE VALIDACIÓN PARA USUARIOS
   * Incluye registro y login con validaciones estrictas
   */
  user: {
    // Esquema para registro de nuevos usuarios
    register: Joi.object({
      // Nombre: 2-50 caracteres, solo letras y espacios (incluye acentos)
      first_name: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
      // Apellido: mismas reglas que el nombre
      last_name: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
      // Email: formato válido, máximo 100 caracteres, convertido a minúsculas
      email: Joi.string().email().max(100).lowercase().required(),
      // Contraseña segura: min 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial
      password: Joi.string().min(8).max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
        }),
      // Fecha de nacimiento: mayor de 18 años (misma regla que el modelo de usuario)
      birth_date: Joi.date().required().custom((value, helpers) => {
        const limit = new Date();
        limit.setFullYear(limit.getFullYear() - 18);
        return value <= limit ? value : helpers.message('Debes ser mayor de 18 años para registrarte');
      })
    }),
    
    // Esquema para inicio de sesión (menos restrictivo que registro)
    login: Joi.object({
      // Email: formato válido, máximo 100 caracteres
      email: Joi.string().email().max(100).required(),
      // Contraseña: solo verifica que no esté vacía (la validación de seguridad se hizo en registro)
      password: Joi.string().min(1).max(128).required()
    })
  },

  /**
   * ESQUEMAS DE VALIDACIÓN PARA PRODUCTOS
   * Usado en la creación y actualización de productos del catálogo
   */
  product: {
    // Esquema para crear nuevos productos
    create: Joi.object({
      // Título del producto: 3-100 caracteres
      title: Joi.string().min(3).max(100).required(),
      // Descripción: 10-500 caracteres (suficiente información pero no excesiva)
      description: Joi.string().min(10).max(500).required(),
      // Categoría: 3-50 caracteres
      category: Joi.string().min(3).max(50).required(),
      // Precio: número positivo con máximo 2 decimales, hasta $999,999.99
      price: Joi.number().positive().precision(2).max(999999.99).required(),
      // Código del producto: alfanumérico, 3-20 caracteres, convertido a mayúsculas
      code: Joi.string().alphanum().min(3).max(20).uppercase().required(),
      // Stock: entero no negativo, máximo 999,999 unidades
      stock: Joi.number().integer().min(0).max(999999).required()
    })
  }
};

/**
 * MIDDLEWARE PRINCIPAL DE VALIDACIÓN JOI
 * 
 * Función de orden superior que crea middlewares de validación usando esquemas Joi.
 * Implementa buenas prácticas de seguridad OWASP y manejo de errores robusto.
 * 
 * @param {Joi.Schema} schema - Esquema Joi para validar los datos
 * @returns {Function} Middleware que valida req.body contra el esquema
 * 
 * Características:
 * - Aborta en el primer error (abortEarly: false para mostrar todos los errores)
 * - Elimina propiedades desconocidas (stripUnknown: true)
 * - Convierte tipos automáticamente (convert: true)
 * - Registra intentos de validación fallidos para monitoreo de seguridad
 * 
 * Ejemplos de uso:
 * - router.post('/register', validate(schemas.user.register), registerUser)
 * - router.post('/products', validate(schemas.product.create), createProduct)
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        errors: errors
      });

      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Datos Inválidos',
          message: 'Por favor, revisa los datos ingresados.',
          errors: errors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        code: 'VALIDATION_ERROR'
      });
    }

    req.body = value;
    next();
  };
};

export { schemas };
