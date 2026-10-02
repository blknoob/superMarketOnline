/**
 * @fileoverview Middlewares de autenticación con Passport.js
 * 
 * Conjunto de middlewares que utilizan Passport.js para autenticación
 * y autorización. Incluye funciones para verificación JWT, control
 * de acceso administrativo y manejo de sesiones de usuario.
 * 
 * FUNCIONALIDADES:
 * - Autenticación JWT con redirección automática
 * - Verificación de permisos de administrador
 * - Redirección condicional basada en autenticación
 * - Inyección de datos de usuario en vistas
 * 
 * INTEGRACIÓN:
 * - Trabaja con la configuración de Passport en configs/
 * - Compatible con estrategia JWT desde cookies
 * - Integrado con sistema de roles de usuario
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import passport from "passport";

/**
 * Middleware de autenticación Passport con estrategia JWT
 * 
 * Utiliza Passport.js para autenticar usuarios mediante JWT.
 * Redirige automáticamente a /login en caso de fallo de autenticación.
 * No mantiene sesión (session: false) ya que usa tokens.
 * 
 * CONFIGURACIÓN:
 * - Estrategia: JWT
 * - Sesión: Deshabilitada
 * - Redirección en fallo: /login
 * - Extractor: Cookies (configurado en passport config)
 * 
 * @constant {Function} authenticatePassport
 */
export const authenticatePassport = passport.authenticate("jwt", {
  session: false,
  failureRedirect: "/login",
});

/**
 * Middleware de verificación de permisos de administrador
 * 
 * Verifica que el usuario autenticado tenga rol de administrador.
 * Debe usarse después de un middleware de autenticación.
 * Renderiza página de permisos en caso de acceso denegado.
 * 
 * VERIFICACIÓN:
 * - req.user debe existir (usuario autenticado)
 * - req.user.role debe ser 'admin'
 * - Respuesta: render de página 'permissions'
 * 
 * @function requireAdmin
 * @param {Object} req - Request con req.user poblado
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.render("permissions", {
      title: "Sin Permisos",
      message: "Solo administradores",
    });
  }
  next();
};

/**
 * Middleware de redirección condicional basada en autenticación
 * 
 * Utiliza Passport para verificar autenticación de manera no bloqueante.
 * Si el usuario está autenticado, redirige a la página principal.
 * Si no está autenticado, continúa con el siguiente middleware.
 * 
 * CASOS DE USO:
 * - Páginas de login (evitar acceso si ya está autenticado)
 * - Páginas de registro (redireccionar usuarios logueados)
 * - Rutas públicas con redirección inteligente
 * 
 * @function redirectPassport
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const redirectPassport = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (user) return res.redirect("/");
    next();
  })(req, res, next);
};

/**
 * Middleware para inyectar datos de usuario en vistas
 * 
 * Convierte el objeto usuario de Mongoose a objeto plano y lo
 * hace disponible en res.locals.user para su uso en plantillas
 * Handlebars. Maneja tanto objetos Mongoose como objetos planos.
 * 
 * FUNCIONALIDAD:
 * - Convierte req.user a objeto serializable
 * - Inyecta en res.locals.user para templates
 * - Maneja casos donde no hay usuario autenticado
 * - Compatible con objetos Mongoose y planos
 * 
 * CASOS DE USO:
 * - Mostrar información de usuario en navbar
 * - Personalización de vistas según usuario
 * - Acceso a datos de usuario en todas las plantillas
 * 
 * @function userInSesion
 * @param {Object} req - Request con posible req.user
 * @param {Object} res - Response, se modifica res.locals.user
 * @param {Function} next - Función next de Express
 */
export function userInSesion(req, res, next) {
  if (req.user) {
    res.locals.user = req.user.toObject
      ? req.user.toObject()
      : JSON.parse(JSON.stringify(req.user));
  } else {
    res.locals.user = null;
  }
  next();
}
