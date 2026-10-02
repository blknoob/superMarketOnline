/**
 * @fileoverview Middleware de autenticación unificado para APIs y vistas
 * 
 * Sistema de autenticación flexible que funciona tanto para endpoints de API
 * como para rutas de vistas del servidor. Maneja tokens JWT desde cookies
 * o headers Authorization, con respuestas adaptativas según el tipo de cliente.
 * 
 * CARACTERÍSTICAS:
 * - Autenticación JWT desde cookies o headers
 * - Respuestas adaptativas (HTML/JSON)
 * - Verificación de roles de administrador
 * - Integración con repositorio de usuarios
 * - Redirecciones automáticas para vistas
 * 
 * SEGURIDAD:
 * - Validación de integridad de tokens
 * - Verificación de existencia de usuario
 * - Control de acceso basado en roles
 * - Manejo seguro de errores
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import { verifyToken } from "../utils/jwt.js";
import UsersRepository from "../repositories/users.repository.js";

const usersRepository = new UsersRepository();

/**
 * Middleware de autenticación unificado para APIs y vistas
 * 
 * Verifica la presencia y validez del token JWT, ya sea desde cookies
 * o headers Authorization. Responde de manera apropiada según el
 * tipo de cliente (HTML para vistas, JSON para APIs).
 * 
 * FLUJO DE AUTENTICACIÓN:
 * 1. Extrae token desde cookies o header Authorization
 * 2. Verifica integridad y validez del token
 * 3. Adjunta información de usuario a req.user
 * 4. Responde según tipo de cliente en caso de error
 * 
 * CASOS DE USO:
 * - Rutas protegidas que requieren autenticación
 * - Endpoints de API con verificación de usuario
 * - Páginas web que requieren login
 * - Middleware base para autorización de roles
 * 
 * @function authenticate
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 * @returns {void}
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    // Para vistas: redirigir a login
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    // Para APIs: retornar error JSON
    return res.status(401).json({
      success: false,
      message: "Token requerido",
      code: "TOKEN_REQUIRED"
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
      code: "TOKEN_INVALID"
    });
  }

  // Adjuntar usuario a request
  req.user = decoded;
  next();
};

/**
 * Middleware de autorización para administradores
 * 
 * Verifica que el usuario autenticado tenga rol de administrador.
 * Debe usarse después del middleware authenticate. Responde de
 * manera apropiada según el tipo de cliente.
 * 
 * VERIFICACIONES:
 * - Usuario debe estar autenticado (req.user debe existir)
 * - Usuario debe tener role === 'admin'
 * - Respuesta adaptativa según tipo de cliente
 * 
 * CASOS DE USO:
 * - Panel de administración
 * - Gestión de productos
 * - Gestión de usuarios
 * - Operaciones administrativas críticas
 * 
 * @function requireAdmin
 * @param {Object} req - Objeto request de Express con req.user
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 * @returns {void}
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      message: "No autenticado",
      code: "NOT_AUTHENTICATED"
    });
  }

  if (req.user.role !== "admin") {
    if (req.accepts('html')) {
      return res.status(403).render("error", {
        title: "Sin Permisos",
        message: "Solo administradores pueden acceder a esta sección"
      });
    }
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: Se requieren permisos de administrador",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }

  next();
};

// Alias para compatibilidad con código existente
export const authenticateToken = authenticate;
export const isAdmin = requireAdmin;
