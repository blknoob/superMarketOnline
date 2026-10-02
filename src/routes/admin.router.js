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
import ProductsController from "../controllers/products.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const adminController = new AdminController();
const productsController = new ProductsController();

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

/**
 * RUTAS DE GESTIÓN ADMINISTRATIVA DE PRODUCTOS
 * 
 * Endpoints privilegiados para administración de catálogo de productos
 * Operaciones que requieren permisos administrativos
 */

/**
 * CREAR PRODUCTO
 * POST /admin/products
 * 
 * Creación administrativa de nuevo producto en catálogo
 * Acceso directo sin restricciones de usuario
 * 
 * BODY: Datos completos del producto
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.createProduct
 * RESPONSE: Producto creado (201) o error de validación
 */
router.post("/products", productsController.createProduct);

/**
 * ACTUALIZAR PRODUCTO
 * PUT /admin/products/:id
 * 
 * Actualización administrativa de producto existente
 * Modificación completa de cualquier campo del producto
 * 
 * PARAMS: id - ObjectId del producto
 * BODY: Campos a actualizar
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.updateProduct
 * RESPONSE: Producto actualizado o error 404
 */
router.put("/products/:id", productsController.updateProduct);

/**
 * ACTUALIZAR PRODUCTO VIA FORMULARIO
 * POST /admin/products/edit/:id
 * 
 * Actualización de producto desde formulario HTML (método POST)
 * Redirige al formulario con mensaje de éxito/error
 * 
 * PARAMS: id - ObjectId del producto
 * BODY: Campos a actualizar desde formulario
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.updateProduct
 * RESPONSE: Redirect con mensaje
 */
router.post("/products/edit/:id", productsController.updateProduct);

/**
 * ELIMINAR PRODUCTO
 * DELETE /admin/products/:id
 * 
 * Eliminación administrativa de producto del catálogo
 * Operación que afecta disponibilidad en tienda
 * 
 * PARAMS: id - ObjectId del producto
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.deleteProduct
 * RESPONSE: Confirmación de eliminación
 * WARNING: Puede afectar carritos y órdenes existentes
 */
router.delete("/products/:id", productsController.deleteProduct);

/**
 * ACTUALIZAR PRECIOS CON COTIZACIÓN EUR
 * POST /admin/update-prices
 * 
 * Actualiza todos los precios de productos basándose en cotización EUR manual
 * Aplica conversión y markup a precios base almacenados en EUR
 * 
 * BODY: { eurRate: number, markup?: number }
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.updatePricesWithEurRate
 * RESPONSE: { success: boolean, updatedCount: number }
 * OPERATION: Actualización masiva de precios en base de datos
 */
router.post("/update-prices", adminController.updatePricesWithEurRate);

/**
 * MIGRAR CAMPO REF A PRODUCTOS EXISTENTES
 * POST /admin/migrate-ref
 * 
 * Endpoint temporal para agregar campo ref a productos existentes
 * Copia el valor actual de price al nuevo campo ref
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.migrateRefField
 * RESPONSE: { success: boolean, updatedCount: number }
 * OPERATION: Migración de datos una sola vez
 */
router.post("/migrate-ref", adminController.migrateRefField);

/**
 * RESTAURAR PRECIOS ORIGINALES
 * POST /admin/restore-prices
 * 
 * Restaura precios a sus valores originales
 * Copia el campo ref de vuelta al campo price
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.restorePrices
 * RESPONSE: { success: boolean, restoredCount: number }
 * OPERATION: Restaurar precios dañados por actualizaciones automáticas
 */
router.post("/restore-prices", authenticateToken, isAdmin, adminController.restorePrices);

/**
 * FIJAR REF EN VALOR CORRECTO
 * POST /admin/fix-ref
 * 
 * Fija el campo ref en 6 para todos los productos
 * Para reparar valores de ref multiplicados incorrectamente
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: AdminController.fixRefValues
 * RESPONSE: { success: boolean, fixedCount: number }
 */
router.post("/fix-ref", authenticateToken, isAdmin, adminController.fixRefValues);

/**
 * FIJAR REF EN VALOR CORRECTO - EMERGENCIA
 * POST /admin/emergency-fix-ref
 * 
 * Fija el campo ref en 6 para todos los productos
 * Para reparar valores de ref multiplicados incorrectamente
 * SIN AUTENTICACIÓN PARA EMERGENCIA
 */
router.post("/emergency-fix-ref", adminController.fixRefValues);

/**
 * ACTUALIZAR PRECIOS CON COTIZACIÓN EUR - EMERGENCIA
 * POST /admin/emergency-update-prices
 * 
 * Actualiza todos los precios aplicando cotización EUR manual
 * SIN AUTENTICACIÓN PARA EMERGENCIA - SOLO PARA TESTING
 */
router.post("/emergency-update-prices", adminController.emergencyUpdatePrices);

export default router;
