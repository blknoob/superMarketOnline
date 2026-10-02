/**
 * ROUTER ADMINISTRATIVO - RUTAS PRIVILEGIADAS DEL SISTEMA
 * 
 * Router especializado en endpoints administrativos con permisos elevados
 * Proporciona rutas para gestión completa de usuarios y productos
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Middleware de autenticación obligatorio en todas las rutas
 * - Validación de rol administrativo requerida
 * - Acceso exclusivo para administradores verificados
 * - Doble capa de validación (auth + admin)
 * 
 * ENDPOINTS PRINCIPALES:
 * - Gestión completa de usuarios (CRUD + roles)
 * - Administración de productos (crear, editar, eliminar)
 * - Operaciones privilegiadas del sistema
 * 
 * MIDDLEWARES APLICADOS:
 * - authenticateToken: Verifica JWT válido
 * - isAdmin: Confirma rol administrativo
 * - Aplicados a todas las rutas del router
 * 
 * CONTROLADORES INTEGRADOS:
 * - AdminController: Operaciones de usuarios
 * - ProductsController: Gestión de productos
 * 
 * BASE PATH: /admin
 * SECURITY LEVEL: Máximo (Admin Only)
 */
import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const adminController = new AdminController();

// Aplicar middlewares de seguridad a todas las rutas administrativas
router.use(authenticateToken, isAdmin);

/**
 * RUTAS DE GESTIÓN DE USUARIOS ADMINISTRATIVAS
 * 
 * Conjunto de endpoints para administración completa de usuarios
 * Requiere permisos de administrador para todos los endpoints
 */

/**
 * LISTAR TODOS LOS USUARIOS
 * GET /admin/users
 * 
 * Endpoint administrativo para consultar todos los usuarios del sistema
 * Retorna lista completa sin restricciones de propiedad
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.getAllUsers
 * RESPONSE: Array de usuarios con UserDTO aplicado
 */
router.get("/users", adminController.getAllUsers);

/**
 * OBTENER USUARIO POR ID
 * GET /admin/users/:id
 * 
 * Consulta administrativa de usuario específico por ObjectId
 * Acceso completo a datos de cualquier usuario
 * 
 * PARAMS: id - ObjectId del usuario
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.getUserById
 * RESPONSE: Datos completos del usuario o error 404
 */
router.get("/users/:id", adminController.getUserById);

/**
 * ACTUALIZAR USUARIO
 * PUT /admin/users/:id
 * 
 * Actualización administrativa de datos de usuario
 * Permite modificación sin restricciones de propiedad
 * 
 * PARAMS: id - ObjectId del usuario
 * BODY: Datos a actualizar
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.updateUser
 * RESPONSE: Confirmación de actualización
 */
router.put("/users/:id", adminController.updateUser);

/**
 * ELIMINAR USUARIO
 * DELETE /admin/users/:id
 * 
 * Eliminación administrativa de usuario del sistema
 * Operación crítica que requiere máximos privilegios
 * 
 * PARAMS: id - ObjectId del usuario
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.deleteUser
 * RESPONSE: Confirmación de eliminación
 * WARNING: Operación irreversible
 */
router.delete("/users/:id", adminController.deleteUser);

/**
 * CAMBIAR ROL DE USUARIO
 * PUT /admin/users/:id/role
 * 
 * Modificación administrativa de rol de usuario
 * Permite asignar roles: user, premium, admin
 * 
 * PARAMS: id - ObjectId del usuario
 * BODY: { role: 'nuevo_rol' }
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.changeUserRole
 * RESPONSE: Usuario actualizado con nuevo rol
 */
router.put("/users/:id/role", adminController.changeUserRole);

// Productos y categorías se administran en /api/products y /api/categories

export default router;
