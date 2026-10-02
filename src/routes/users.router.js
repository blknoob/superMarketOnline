/**
 * ROUTER DE USUARIOS - AUTENTICACIÓN Y GESTIÓN DE CUENTAS
 * 
 * Router dedicado a operaciones de usuarios, autenticación y gestión de cuentas
 * Implementa estándares OWASP para seguridad en autenticación
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Registro y autenticación de usuarios
 * - Gestión de sesiones y tokens JWT
 * - Recuperación y cambio de contraseñas
 * - Consulta de perfil de usuario actual
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Validación robusta de entrada con schemas
 * - Implementación de estándares OWASP
 * - Autenticación basada en JWT
 * - Hash seguro de contraseñas
 * - Rate limiting implícito
 * 
 * MIDDLEWARES APLICADOS:
 * - validate(): Validación de schemas de entrada
 * - authenticateToken: Verificación de JWT (rutas protegidas)
 * - Schemas específicos para cada endpoint
 * 
 * TIPOS DE RUTAS:
 * - Públicas: register, login, logout, forgot-password, reset-password
 * - Protegidas: current, change-password (requieren autenticación)
 * 
 * BASE PATH: /users
 * SECURITY LEVEL: Mínimo (público) a Alto (autenticado)
 */
import { Router } from "express";
import UsersController from "../controllers/users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validate, schemas } from "../middlewares/validation.middleware.js";

const router = Router();
const usersController = new UsersController();

/**
 * RUTAS PÚBLICAS DE AUTENTICACIÓN
 * 
 * Endpoints accesibles sin autenticación previa
 * Implementan validación robusta según estándares OWASP
 */

/**
 * REGISTRO DE USUARIO
 * POST /users/register
 * 
 * Endpoint público para crear nueva cuenta de usuario
 * Incluye validación exhaustiva de datos de entrada
 * 
 * BODY SCHEMA: schemas.user.register
 * - first_name: Nombre del usuario
 * - last_name: Apellido del usuario
 * - email: Email único válido
 * - password: Contraseña segura
 * - age: Edad del usuario
 * 
 * MIDDLEWARE: validate(schemas.user.register)
 * CONTROLLER: UsersController.register
 * RESPONSE: Usuario creado con JWT o errores de validación
 * SECURITY: Hash de contraseña, validación de email único
 */
router.post("/register", validate(schemas.user.register), usersController.register);

/**
 * INICIO DE SESIÓN
 * POST /users/login
 * 
 * Endpoint público para autenticación de usuarios
 * Genera JWT para acceso a rutas protegidas
 * 
 * BODY SCHEMA: schemas.user.login
 * - email: Email del usuario
 * - password: Contraseña del usuario
 * 
 * MIDDLEWARE: validate(schemas.user.login)
 * CONTROLLER: UsersController.login
 * RESPONSE: JWT token y datos de usuario o error 401
 * SECURITY: Verificación de hash, generación de JWT
 */
router.post("/login", validate(schemas.user.login), usersController.login);

/**
 * CERRAR SESIÓN
 * POST /users/logout
 * 
 * Endpoint público para invalidar sesión de usuario
 * Limpia cookies y tokens del cliente
 * 
 * MIDDLEWARE: Ninguno (público)
 * CONTROLLER: UsersController.logout
 * RESPONSE: Confirmación de logout
 * SECURITY: Limpieza de tokens, invalidación de sesión
 */
router.post("/logout", usersController.logout);

/**
 * RUTAS DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Endpoints públicos para recuperación segura de contraseñas
 * Implementan flujo de reset con tokens temporales
 */

/**
 * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * POST /users/forgot-password
 * 
 * Endpoint público para iniciar proceso de recuperación
 * Envía email con enlace de reset temporal
 * 
 * BODY: { email: string }
 * MIDDLEWARE: Ninguno (público)
 * CONTROLLER: UsersController.forgotPassword
 * RESPONSE: Confirmación de envío de email
 * SECURITY: Token temporal, expiración de enlace
 */
router.post("/forgot-password", usersController.forgotPassword);

/**
 * RESTABLECER CONTRASEÑA
 * POST /users/reset-password
 * 
 * Endpoint público para completar recuperación
 * Valida token temporal y establece nueva contraseña
 * 
 * BODY: { token: string, newPassword: string }
 * MIDDLEWARE: Ninguno (público)
 * CONTROLLER: UsersController.resetPassword
 * RESPONSE: Confirmación de cambio
 * SECURITY: Validación de token, hash de nueva contraseña
 */
router.post("/reset-password", usersController.resetPassword);

/**
 * RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
 * 
 * Endpoints que requieren JWT válido para acceso
 * Operaciones sobre cuenta del usuario autenticado
 */

/**
 * OBTENER USUARIO ACTUAL
 * GET /users/current
 * 
 * Endpoint protegido para consultar datos del usuario autenticado
 * Retorna información del perfil basada en JWT
 * 
 * MIDDLEWARE: authenticateToken
 * CONTROLLER: UsersController.current
 * RESPONSE: Datos del usuario autenticado
 * SECURITY: JWT requerido, datos filtrados por DTO
 */
router.get("/current", authenticateToken, usersController.current);

/**
 * CAMBIAR CONTRASEÑA
 * PUT /users/change-password
 * 
 * Endpoint protegido para cambio de contraseña del usuario autenticado
 * Requiere contraseña actual para validación
 * 
 * BODY: { currentPassword: string, newPassword: string }
 * MIDDLEWARE: authenticateToken
 * CONTROLLER: UsersController.changePassword
 * RESPONSE: Confirmación de cambio
 * SECURITY: JWT requerido, verificación de contraseña actual
 */
router.put(
  "/change-password",
  authenticateToken,
  usersController.changePassword
);

export default router;
