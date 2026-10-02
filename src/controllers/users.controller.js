import UserDTO from "../dtos/user.dto.js";
import UsersService from "../services/users.service.js";
import { generateToken } from "../utils/jwt.js";
import { logAuthAttempt, logSecurityEvent } from "../utils/logger.js";

const usersService = new UsersService();

/**
 * CONTROLLER DE USUARIOS - AUTENTICACIÓN Y GESTIÓN DE CUENTAS
 * 
 * Controller que maneja todas las operaciones HTTP relacionadas con usuarios
 * Incluye autenticación, registro, gestión de sesión y recuperación de contraseñas
 * 
 * ENDPOINTS EXPUESTOS:
 * GET    /current         - Ver perfil del usuario autenticado
 * POST   /register        - Registrar nuevo usuario
 * POST   /login          - Iniciar sesión
 * POST   /logout         - Cerrar sesión
 * GET    /current/api    - Obtener datos del usuario actual (API)
 * PUT    /change-password - Cambiar contraseña
 * POST   /forgot-password - Solicitar recuperación de contraseña
 * POST   /reset-password - Restablecer contraseña con token
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Logging detallado de intentos de autenticación (OWASP)
 * - Cookies HTTP-only para tokens
 * - Manejo seguro de errores sin exposición de datos
 * - DTOs para filtrar datos sensibles en respuestas
 * - Rate limiting en endpoints críticos (middleware)
 * 
 * MANEJO DE RESPUESTAS:
 * - Content negotiation: JSON vs HTML redirects
 * - Cookies seguras en producción (secure flag)
 * - Tokens JWT con expiración (24 horas)
 * - Mensajes genéricos para prevenir enumeración
 * 
 * INTEGRACIONES:
 * - UsersService: Para lógica de negocio
 * - UserDTO: Para filtrado de datos sensibles
 * - JWT utils: Para manejo de tokens
 * - Logger: Para auditoría de seguridad
 */
class UsersController {
  /**
   * VER PERFIL DE USUARIO (HTML)
   * 
   * Endpoint: GET /current
   * Renderiza la vista HTML del perfil del usuario autenticado
   * 
   * AUTENTICACIÓN:
   * - Requiere usuario autenticado (req.user)
   * - Redirige a login si no hay sesión activa
   * 
   * TRANSFORMACIÓN DE DATOS:
   * - Convierte documento Mongoose a objeto plano
   * - Maneja tanto objetos Mongoose como objetos JSON
   * - Prepara datos para renderizado en template
   * 
   * RESPUESTA:
   * - Renderiza template "users/current" con datos del usuario
   * - Redirige a "/login" si usuario no autenticado
   * - Error 500 si hay problemas en renderizado
   * 
   * @param {Object} req - Request con req.user del middleware de auth
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Renderiza HTML o redirige
   */
  async getCurrentView(req, res) {
    try {
      if (!req.user) {
        return res.redirect("/login");
      }

      const user = req.user.toObject
        ? req.user.toObject()
        : JSON.parse(JSON.stringify(req.user));
      res.render("users/current", { user });
    } catch (error) {
      res.status(500).send("Error mostrando el perfil de usuario");
    }
  }

  /**
   * REGISTRAR NUEVO USUARIO
   * 
   * Endpoint: POST /register
   * Crea una nueva cuenta de usuario con autenticación automática
   * 
   * BODY PARAMETERS:
   * - first_name: Nombre del usuario
   * - last_name: Apellido del usuario
   * - email: Email único para la cuenta
   * - password: Contraseña en texto plano (se hashea)
   * - age: Edad (opcional)
   * 
   * PROCESO DE REGISTRO:
   * 1. Validar datos de entrada
   * 2. Crear usuario con role "user" por defecto
   * 3. Generar token JWT para sesión automática
   * 4. Establecer cookie HTTP-only con token
   * 5. Redirigir a perfil ("/current")
   * 6. Log de seguridad del registro
   * 
   * SEGURIDAD IMPLEMENTADA:
   * - Logging de intentos de registro (exitosos y fallidos)
   * - Validación de unicidad de email
   * - Hash seguro de contraseña
   * - Cookie segura con flags apropiados
   * - Rate limiting (manejado por middleware)
   * 
   * RESPUESTA EXITOSA:
   * - Redirige a "/current" con cookie de sesión
   * 
   * RESPUESTA ERROR:
   * - Status code apropiado (400/500)
   * - JSON con status "error" y mensaje descriptivo
   * - Log de intento fallido para auditoría
   * 
   * @param {Object} req - Request con datos de registro en body
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} Redirige o retorna JSON de error
   */
  async register(req, res) {
    try {
      const { first_name, last_name, email, password, birth_date } = req.body;

      const response = await usersService.createUser({
        first_name,
        last_name,
        email,
        password,
        birth_date,
        role: "user",
      });

      if (response.error) {
        // OWASP - Log intento de registro fallido
        logAuthAttempt('register', email, false, req, response.message);
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      // OWASP - Log registro exitoso
      logAuthAttempt('register', email, true, req);

      const token = generateToken({
        _id: response._id,
        email: response.email,
        role: response.role,
        first_name: response.first_name,
        last_name: response.last_name,
      });
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.redirect("/current");
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * INICIAR SESIÓN
   * 
   * Endpoint: POST /login
   * Autentica usuario y establece sesión con cookie JWT
   * 
   * BODY PARAMETERS:
   * - email: Email de la cuenta
   * - password: Contraseña en texto plano
   * 
   * CONTENT NEGOTIATION:
   * - Accept: application/json → Respuesta JSON con token
   * - Accept: text/html → Redirección HTML
   * 
   * PROCESO DE LOGIN:
   * 1. Validar credenciales via UsersService
   * 2. Generar token JWT con datos del usuario
   * 3. Establecer cookie HTTP-only segura
   * 4. Responder según content negotiation
   * 5. Log de seguridad del intento
   * 
   * TOKEN JWT INCLUYE:
   * - _id: ID del usuario
   * - email: Email para identificación
   * - role: Role para autorización
   * - first_name, last_name: Para personalización
   * 
   * COOKIE CONFIGURATION:
   * - httpOnly: true (previene acceso JavaScript)
   * - secure: true en producción (solo HTTPS)
   * - maxAge: 24 horas
   * 
   * @param {Object} req - Request con credenciales en body
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON o redirección según Accept header
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const response = await usersService.login(email, password);

      if (response.error) {
        // OWASP - Log intento de login fallido
        logAuthAttempt('login', email, false, req, response.message);
        
        if (
          req.headers.accept &&
          req.headers.accept.includes("application/json")
        ) {
          return res.status(response.type || 500).json({
            status: "error",
            message: response.message,
          });
        }

        return res.redirect("/login");
      }

      // OWASP - Log login exitoso
      logAuthAttempt('login', email, true, req);

      const token = generateToken({
        _id: response.user._id,
        email: response.user.email,
        role: response.user.role,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
      });
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      if (
        req.headers.accept &&
        req.headers.accept.includes("application/json")
      ) {
        return res.json({
          status: "success",
          message: "Login exitoso",
          user: new UserDTO(response.user),
          token: token,
        });
      }

      return res.redirect("/");
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * CERRAR SESIÓN
   * 
   * Endpoint: POST /logout
   * Invalida la sesión del usuario eliminando la cookie JWT
   * 
   * PROCESO DE LOGOUT:
   * 1. Limpiar cookie "access_token" del navegador
   * 2. Confirmar logout exitoso
   * 
   * SEGURIDAD:
   * - Limpieza completa de cookie de sesión
   * - Token queda inválido en cliente
   * - No requiere autenticación previa (idempotente)
   * 
   * NOTA: El token JWT sigue siendo válido hasta su expiración
   * Para invalidación inmediata considerar implementar blacklist
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con confirmación
   */
  async logout(req, res) {
    try {
      res.clearCookie("access_token");
      res.json({
        status: "success",
        message: "Logout exitoso",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * OBTENER USUARIO ACTUAL (API)
   * 
   * Endpoint: GET /current/api
   * Retorna los datos del usuario autenticado en formato JSON
   * 
   * AUTENTICACIÓN:
   * - Requiere token JWT válido (middleware)
   * - req.user debe estar poblado por middleware de auth
   * 
   * FILTRADO DE DATOS:
   * - Utiliza UserDTO para filtrar campos sensibles
   * - No expone password, tokens de reset, etc.
   * - Retorna solo datos seguros para el frontend
   * 
   * CASOS DE USO:
   * - APIs para aplicaciones SPA/mobile
   * - Verificación de sesión activa
   * - Obtener datos de usuario para UI
   * - Validación de permisos en frontend
   * 
   * @param {Object} req - Request con req.user del middleware
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON con datos del usuario o error
   */
  async current(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
      }

      res.json({
        status: "success",
        user: new UserDTO(req.user),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error obteniendo usuario actual",
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { newPassword } = req.body;
      const userId = req.user._id;

      const response = await usersService.changePassword(userId, newPassword);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({ status: "success", message: response.message });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
   * 
   * Endpoint: POST /forgot-password
   * Inicia el proceso de recuperación enviando email con token
   * 
   * BODY PARAMETERS:
   * - email: Email de la cuenta a recuperar
   * 
   * CONTENT NEGOTIATION:
   * - Accept: application/json → Respuesta JSON
   * - Accept: text/html → Redirige a login
   * 
   * PROCESO DE RECUPERACIÓN:
   * 1. Validar email proporcionado
   * 2. Generar token JWT con expiración (1 hora)
   * 3. Guardar token en base de datos
   * 4. Enviar email con enlace de recuperación
   * 5. Respuesta genérica por seguridad
   * 
   * SEGURIDAD Y PRIVACIDAD:
   * - No revela si el email existe en el sistema
   * - Respuesta genérica para prevenir enumeración
   * - Token con expiración de 1 hora
   * - Enlace de un solo uso
   * 
   * @param {Object} req - Request con email en body
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON o redirección
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const response = await usersService.forgotPassword(email);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      if (
        !req.headers.accept ||
        !req.headers.accept.includes("application/json")
      ) {
        return res.redirect("/login");
      }

      res.json({
        status: "success",
        message:
          "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * RESTABLECER CONTRASEÑA CON TOKEN
   * 
   * Endpoint: POST /reset-password
   * Completa el proceso de recuperación estableciendo nueva contraseña
   * 
   * BODY PARAMETERS:
   * - token: Token de recuperación recibido por email
   * - newPassword: Nueva contraseña en texto plano
   * 
   * CONTENT NEGOTIATION:
   * - Accept: application/json → Respuesta JSON
   * - Accept: text/html → Redirige con parámetros
   * 
   * PROCESO DE RESTABLECIMIENTO:
   * 1. Validar token y nueva contraseña
   * 2. Verificar token no expirado
   * 3. Confirmar nueva contraseña diferente
   * 4. Hashear nueva contraseña
   * 5. Actualizar usuario y limpiar token
   * 6. Confirmar restablecimiento exitoso
   * 
   * VALIDACIONES DE SEGURIDAD:
   * - Token válido y no expirado
   * - Nueva contraseña diferente a la anterior
   * - Invalidación automática del token
   * - Encriptación segura de nueva contraseña
   * 
   * @param {Object} req - Request con token y newPassword en body
   * @param {Object} res - Response de Express
   * @returns {Promise<void>} JSON o redirección según Accept header
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const response = await usersService.resetPassword(token, newPassword);

      if (response.error) {
        if (
          !req.headers.accept ||
          !req.headers.accept.includes("application/json")
        ) {
          return res.redirect("/login?error=token");
        }
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      if (
        !req.headers.accept ||
        !req.headers.accept.includes("application/json")
      ) {
        return res.redirect("/login?reset=ok");
      }

      res.json({
        status: "success",
        message: "Contraseña restablecida exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }
}

export default UsersController;
