/**
 * ROUTER PRINCIPAL - COORDINADOR CENTRAL DE RUTAS
 * 
 * Router maestro que organiza y distribuye todas las rutas del sistema
 * Actúa como punto de entrada único para toda la API y vistas web
 * 
 * ARQUITECTURA DE ENRUTAMIENTO:
 * - API Routes: /api/* para endpoints RESTful
 * - View Routes: /* para renderizado de páginas web
 * - Health Check: /health para monitoreo de sistema
 * 
 * ORGANIZACIÓN POR MÓDULOS:
 * - users: Autenticación y gestión de usuarios
 * - products: Catálogo y administración de productos
 * - carts: Carrito de compras y operaciones
 * - categories: Árbol de categorías
 * - orders: Pedidos del usuario
 * - admin: Herramientas administrativas privilegiadas
 * - views: Renderizado de interfaces web
 * 
 * CARACTERÍSTICAS ESPECIALES:
 * - Health Check para Docker y monitoreo
 * - Separación clara entre API y Views
 * - Estructura RESTful consistente
 * - Integración con todos los subsistemas
 * 
 * PATRÓN IMPLEMENTADO:
 * - Router Pattern: Distribución modular de rutas
 * - API Gateway: Punto de entrada centralizado
 * - Separation of Concerns: Lógica separada por dominio
 * 
 * BASE PATHS:
 * - /api/* : Endpoints RESTful de la API
 * - /* : Vistas web y navegación
 * - /health : Endpoint de salud del sistema
 */
import { Router } from "express";
import usersRouter from "./users.router.js";
import productsRouter from "./products.router.js";
import cartsRouter from "./carts.router.js";
import adminRouter from "./admin.router.js";
import categoriesRouter from "./categories.router.js";
import ordersRouter from "./orders.router.js";
import currencyRouter from "./currency.router.js";
import authRouter from "./auth.router.js";
import viewsRouter from "./views.router.js";

const router = Router();

/**
 * HEALTH CHECK ENDPOINT - MONITOREO DEL SISTEMA
 * GET /health
 * 
 * Endpoint de salud del sistema para monitoreo y Docker
 * Proporciona información del estado de la aplicación
 * 
 * FUNCIONALIDADES:
 * - Verificación de estado del servidor
 * - Timestamp de consulta
 * - Tiempo de actividad (uptime)
 * - Entorno de ejecución actual
 * 
 * USO PRINCIPAL:
 * - Docker health checks
 * - Monitoreo de infraestructura
 * - Load balancer health checks
 * - Verificación de despliegues
 * 
 * MIDDLEWARE: Ninguno (endpoint público)
 * RESPONSE: JSON con datos de estado del sistema
 * SECURITY: Público pero sin información sensible
 */
// OWASP - Health check endpoint para Docker
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

/**
 * RUTAS DE API RESTful
 * 
 * Conjunto de routers especializados para endpoints de API
 * Todas las rutas API usan el prefijo /api/ para diferenciación
 */

/**
 * API DE USUARIOS - /api/users/*
 * Autenticación, registro y gestión de cuentas de usuario
 */
router.use("/api/users", usersRouter);

/**
 * API DE PRODUCTOS - /api/products/*
 * Catálogo de productos y funciones administrativas
 */
router.use("/api/products", productsRouter);

/**
 * API DE CATEGORÍAS - /api/categories/*
 * Árbol de categorías del catálogo
 */
router.use("/api/categories", categoriesRouter);

/**
 * API DE ÓRDENES - /api/orders/*
 * Pedidos del usuario autenticado
 */
router.use("/api/orders", ordersRouter);

/**
 * API DE CARRITOS - /api/carts/*
 * Gestión de carrito de compras y operaciones relacionadas
 */
router.use("/api/carts", cartsRouter);

/**
 * API DE COTIZACIÓN - /api/currency/*
 * Conversión de monedas y cotizaciones en tiempo real
 */
router.use("/api/currency", currencyRouter);

/**
 * API ADMINISTRATIVA - /api/admin/*
 * Herramientas privilegiadas para administradores del sistema
 */
router.use("/api/admin", adminRouter);

/**
 * AUTENTICACIÓN OAUTH - /auth/*
 * Rutas para login social con Google, Facebook y Apple
 */
router.use("/auth", authRouter);

/**
 * RUTAS DE VISTAS WEB
 * 
 * Router principal para renderizado de páginas web
 * Maneja toda la navegación del frontend y templates
 * 
 * CARACTERÍSTICAS:
 * - Renderizado con Handlebars
 * - Autenticación web con Passport
 * - Interfaces administrativas
 * - Proceso de checkout visual
 * - Formularios de pago
 */
router.use("/", viewsRouter);

export default router;
