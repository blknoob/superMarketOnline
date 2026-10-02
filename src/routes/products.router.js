/**
 * ROUTER DE PRODUCTOS - CATÁLOGO Y GESTIÓN DE PRODUCTOS
 * 
 * Router mixto que combina endpoints públicos y administrativos para productos
 * Proporciona acceso al catálogo y herramientas de administración
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Consulta pública del catálogo de productos
 * - Gestión administrativa de productos (CRUD)
 * - Control de acceso diferenciado por endpoint
 * 
 * NIVELES DE ACCESO:
 * - Público: Consulta de productos (GET /)
 * - Administrativo: Crear, editar y eliminar productos
 * 
 * CARACTERÍSTICAS:
 * - Endpoint público sin restricciones
 * - Endpoints administrativos con doble autenticación
 * - Control granular de permisos
 * - Separación clara entre lectura y escritura
 * 
 * MIDDLEWARES APLICADOS:
 * - authenticateToken: Verificación de JWT (rutas admin)
 * - isAdmin: Validación de rol administrativo (rutas admin)
 * - Aplicados selectivamente según endpoint
 * 
 * CONTROLADOR:
 * - ProductsController: Maneja toda la lógica de productos
 * 
 * BASE PATH: /products
 * SECURITY LEVEL: Mínimo (consulta) a Máximo (administración)
 */
import { Router } from "express";
import ProductsController from "../controllers/products.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const productsController = new ProductsController();

/**
 * RUTA PÚBLICA - CONSULTA DE CATÁLOGO
 */

/**
 * OBTENER TODOS LOS PRODUCTOS
 * GET /products
 * 
 * Endpoint público para consultar catálogo completo de productos
 * Accesible sin autenticación para navegación de tienda
 * 
 * QUERY PARAMS (opcionales):
 * - category: Filtro por categoría principal
 * - subcategory: Filtro por subcategoría
 * - limit: Límite de resultados
 * - page: Página para paginación
 * 
 * MIDDLEWARE: Ninguno (público)
 * CONTROLLER: ProductsController.getAllProducts
 * RESPONSE: Array de productos disponibles
 * SECURITY: Sin restricciones, datos públicos
 */
router.get("/", productsController.getAllProducts);

/**
 * RUTAS ADMINISTRATIVAS - GESTIÓN DE PRODUCTOS
 * 
 * Endpoints que requieren permisos administrativos
 * Doble capa de validación: JWT + rol admin
 */

/**
 * CREAR PRODUCTO
 * POST /products
 * 
 * Endpoint administrativo para agregar nuevo producto al catálogo
 * Requiere autenticación y permisos de administrador
 * 
 * BODY: Datos completos del producto
 * - title: Nombre del producto
 * - description: Descripción detallada
 * - price: Precio del producto
 * - category: Categoría principal
 * - stock: Cantidad disponible
 * - images: Array de URLs de imágenes
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.createProduct
 * RESPONSE: Producto creado (201) o error de validación
 * SECURITY: Acceso exclusivo para administradores
 */
router.post("/", authenticateToken, isAdmin, productsController.createProduct);

/**
 * ACTUALIZAR PRODUCTO
 * PUT /products/:id
 * 
 * Endpoint administrativo para modificar producto existente
 * Permite actualización completa o parcial
 * 
 * PARAMS: id - ObjectId del producto
 * BODY: Campos a actualizar
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.updateProduct
 * RESPONSE: Producto actualizado o error 404
 * SECURITY: Acceso exclusivo para administradores
 */
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  productsController.updateProduct
);

/**
 * ELIMINAR PRODUCTO
 * DELETE /products/:id
 * 
 * Endpoint administrativo para remover producto del catálogo
 * Operación crítica que afecta disponibilidad
 * 
 * PARAMS: id - ObjectId del producto
 * 
 * MIDDLEWARE: authenticateToken + isAdmin
 * CONTROLLER: ProductsController.deleteProduct
 * RESPONSE: Confirmación de eliminación
 * SECURITY: Acceso exclusivo para administradores
 * WARNING: Puede afectar carritos y órdenes existentes
 */
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  productsController.deleteProduct
);

export default router;
