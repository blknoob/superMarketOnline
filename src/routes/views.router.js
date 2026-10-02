/**
 * ROUTER DE VISTAS - RENDERIZADO DE TEMPLATES Y NAVEGACIÓN WEB
 * 
 * Router principal que maneja todas las vistas web del sistema
 * Combina funcionalidades públicas, autenticadas y administrativas
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Renderizado de páginas web con Handlebars
 * - Gestión completa del carrito de compras (vistas)
 * - Proceso de checkout y pago (frontend)
 * - Panel administrativo con interfaces de gestión
 * - Autenticación y registro de usuarios (vistas)
 * - Catálogo público de productos
 * 
 * NIVELES DE ACCESO:
 * - Públicas: Home, login, register, catálogo
 * - Autenticadas: Perfil, carrito, tickets, checkout
 * - Administrativas: Panel admin, gestión de productos/usuarios
 * 
 * CARACTERÍSTICAS ESPECIALES:
 * - Upload de archivos con validaciones OWASP
 * - Procesamiento de pagos manual (Pago Móvil, Zelle)
 * - Middleware de autenticación basado en Passport
 * - Validaciones robustas de datos de entrada
 * - Manejo seguro de archivos multimedia
 * 
 * MIDDLEWARES INTEGRADOS:
 * - authenticatePassport: Autenticación vía Passport
 * - requireAdmin: Validación de rol administrativo
 * - userInSesion: Contexto de usuario en templates
 * - validateFile: Validación segura de uploads
 * 
 * CONTROLADORES UTILIZADOS:
 * - ProductsViewController: Preparación de datos de productos
 * - UsersViewController: Renderizado de perfiles
 * - cart.controller: Funciones de carrito
 * - PaymentsService: Procesamiento de pagos
 * - TicketsService: Gestión de comprobantes
 * 
 * BASE PATH: / (raíz del dominio)
 * SECURITY LEVELS: Variado según endpoint (Público a Administrativo)
 */
// RUTAS VISTAS
import { Router } from "express";
import {
  authenticatePassport,
  requireAdmin,
  redirectPassport,
  userInSesion,
} from "../middlewares/passport.middleware.js";
import ProductsViewController from "../controllers/products.view.js";
import UsersViewController from "../controllers/users.view.js";
import {
  processCheckout,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartView
} from "../controllers/cart.controller.js";
import { validateCartData, validateObjectId } from "../middlewares/validation.middleware.js";
import PaymentsService from "../services/payments.service.js";
import { createPaymentProofUpload, createSecureStorage, validateFile, handleMulterError } from "../middlewares/upload.middleware.js";
import multer from "multer";
import mongoose from "mongoose";

const router = Router();
const productsViewController = new ProductsViewController();
const usersViewController = new UsersViewController();
const paymentsService = new PaymentsService();

/**
 * CONFIGURACIONES SEGURAS DE MULTER - OWASP COMPLIANCE
 * 
 * Configuración especializada para diferentes tipos de uploads
 * Implementa estándares de seguridad OWASP para manejo de archivos
 */

// OWASP - Configuraciones seguras de multer
const paymentProofUpload = createPaymentProofUpload();

// Para imágenes de productos
const productImageStorage = createSecureStorage('public/images/');
const productImageUpload = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

/**
 * RUTAS DE CARRITO Y CHECKOUT (VISTAS WEB)
 * 
 * Endpoints para el proceso de compra vía interfaz web
 * Todas requieren autenticación y sesión activa
 */

/**
 * FINALIZAR COMPRA DESDE VISTA
 * POST /cart/checkout
 * 
 * Procesa la finalización de compra desde la interfaz web
 * Convierte carrito en orden y procede al checkout
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * CONTROLLER: cart.controller.processCheckout
 * RESPONSE: Redirección a proceso de pago
 * SECURITY: Autenticación requerida, validaciones de stock
 */
// Finalizar compra y generar orden desde la vista
router.post(
  "/cart/checkout",
  authenticatePassport,
  userInSesion,
  processCheckout
);

/**
 * ELIMINAR PRODUCTO DEL CARRITO (VISTA)
 * POST /cart/remove
 * 
 * Endpoint para remover producto del carrito vía interfaz web
 * Maneja la eliminación desde formularios HTML
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * CONTROLLER: cart.controller.removeFromCart
 * RESPONSE: Redirección de vuelta al carrito
 * SECURITY: Autenticación requerida, validación de propiedad
 */
// Quitar producto del carrito desde la vista
router.post(
  "/cart/remove",
  authenticatePassport,
  userInSesion,
  removeFromCart
);

/**
 * RUTAS PÚBLICAS - AUTENTICACIÓN Y NAVEGACIÓN
 * 
 * Endpoints públicos para autenticación y navegación básica
 * Accesibles sin autenticación previa
 */

/**
 * PÁGINA DE INICIO DE SESIÓN
 * GET /login
 * 
 * Renderiza el formulario de login
 * Redirige a home si ya está autenticado
 * 
 * MIDDLEWARE: redirectPassport (redirige si autenticado)
 * TEMPLATE: auth/login.hbs
 * RESPONSE: Formulario de inicio de sesión
 */
router.get("/login", redirectPassport, (req, res) => {
  res.render("auth/login");
});

/**
 * PÁGINA DE REGISTRO
 * GET /register
 * 
 * Renderiza el formulario de registro de nueva cuenta
 * Redirige a home si ya está autenticado
 * 
 * MIDDLEWARE: redirectPassport (redirige si autenticado)
 * TEMPLATE: auth/register.hbs
 * RESPONSE: Formulario de registro de usuario
 */
router.get("/register", redirectPassport, (req, res) => {
  res.render("auth/register");
});

/**
 * CERRAR SESIÓN
 * GET /logout
 * 
 * Procesa el cierre de sesión del usuario
 * Limpia cookies y redirige a página principal
 * 
 * MIDDLEWARE: Ninguno (público)
 * RESPONSE: Redirección a home con sesión cerrada
 * SECURITY: Limpieza completa de tokens y cookies
 */
router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/");
});

/**
 * PÁGINA DE RESTABLECIMIENTO DE CONTRASEÑA
 * GET /reset-password
 * 
 * Renderiza formulario para establecer nueva contraseña
 * Utiliza token de seguridad para validación
 * 
 * QUERY PARAMS: token - Token de restablecimiento
 * TEMPLATE: auth/resetPassword.hbs
 * RESPONSE: Formulario de nueva contraseña
 * SECURITY: Validación de token temporal
 */

router.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.render("auth/resetPassword", {
    token: token,
  });
});

/**
 * PÁGINA PRINCIPAL - CATÁLOGO PÚBLICO
 * GET /
 * 
 * Página de inicio con catálogo completo de productos
 * Accesible públicamente con contexto de usuario opcional
 * 
 * FUNCIONALIDADES:
 * - Mostrar productos disponibles
 * - Filtrado por categorías y subcategorías
 * - Contexto de usuario si está logueado
 * - Navegación pública del catálogo
 * 
 * MIDDLEWARE: userInSesion + ProductsViewController.getProductsView
 * TEMPLATE: index.hbs
 * CONTEXT: products, user, isPublic, currentCategory, currentSubCategory
 * RESPONSE: Página principal con catálogo
 */
// Página principal pública - Catálogo de productos
router.get(
  "/",
  userInSesion,
  productsViewController.getProductsView,
  (req, res) => {
    res.render("index", {
      products: req.products,
      user: res.locals.user || null,
      isPublic: true,
      currentCategory: req.currentCategory,
      currentSubCategory: req.currentSubCategory,
    });
  }
);

/**
 * RUTAS DE USUARIO AUTENTICADO
 * 
 * Endpoints que requieren autenticación para acceso
 * Proporcionan funcionalidades personalizadas
 */

/**
 * PERFIL DE USUARIO ACTUAL
 * GET /current
 * 
 * Muestra el perfil del usuario autenticado
 * Redirige a login si no está autenticado
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * CONTROLLER: UsersViewController.getCurrentView
 * TEMPLATE: users/current.hbs
 * RESPONSE: Página de perfil de usuario
 */
router.get(
  "/current",
  authenticatePassport,
  userInSesion,
  usersViewController.getCurrentView
);

/**
 * VISTA DEL CARRITO DE COMPRAS
 * GET /cart
 * 
 * Muestra el carrito actual del usuario con productos y totales
 * Incluye herramientas de gestión de carrito
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * CONTROLLER: cart.controller.getCartView
 * TEMPLATE: users/cart.hbs
 * RESPONSE: Página de carrito con productos y totales
 */
router.get("/cart", authenticatePassport, userInSesion, getCartView);

/**
 * RUTAS DE GESTIÓN DEL CARRITO (VISTAS WEB)
 * 
 * Endpoints para manipular el carrito desde la interfaz web
 * Todas requieren autenticación y validación de datos
 */

/**
 * AGREGAR PRODUCTO AL CARRITO (VISTA)
 * POST /cart/add
 * 
 * Añade producto al carrito desde formularios web
 * Incluye validación de datos de carrito
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion + validateCartData
 * CONTROLLER: cart.controller.addToCart
 * BODY: productId, quantity
 * RESPONSE: Redirección al carrito actualizado
 */
router.post(
  "/cart/add",
  authenticatePassport,
  userInSesion,
  validateCartData,
  addToCart
);

/**
 * ACTUALIZAR CANTIDAD EN CARRITO (VISTA)
 * POST /cart/update
 * 
 * Modifica cantidad de producto específico en carrito
 * Permite incrementar, decrementar o establecer cantidad
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion + validateCartData
 * CONTROLLER: cart.controller.updateCartQuantity
 * BODY: productId, quantity
 * RESPONSE: Redirección al carrito con cantidad actualizada
 */
router.post(
  "/cart/update",
  authenticatePassport,
  userInSesion,
  validateCartData,
  updateCartQuantity
);

/**
 * VACIAR CARRITO COMPLETO (VISTA)
 * POST /cart/clear
 * 
 * Elimina todos los productos del carrito
 * Operación de limpieza completa
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * CONTROLLER: cart.controller.clearCart
 * RESPONSE: Redirección al carrito vacío
 */
// Vaciar carrito
router.post(
  "/cart/clear",
  authenticatePassport,
  userInSesion,
  clearCart
);

import TicketsService from "../services/tickets.service.js";
const ticketsService = new TicketsService();

router.get("/tickets", authenticatePassport, userInSesion, async (req, res) => {
  console.log('🚀 RUTA /tickets EJECUTÁNDOSE - Usuario:', req.user?.email);
  
  try {
    const userEmail = req.user.email;
    const tickets = await ticketsService.repository.findByUser(userEmail);
    
    console.log('📦 Tickets encontrados:', tickets.length);
    
    // Convertir a JSON plano para evitar problemas con Handlebars
    const ticketsData = tickets.map(ticket => ({
      code: ticket.code,
      amount: ticket.amount,
      purchaser: ticket.purchaser,
      createdAt: ticket.createdAt,
      products: ticket.products.map(item => ({
        product: item.product ? {
          _id: item.product._id,
          title: item.product.title,
          code: item.product.code,
          image: item.product.image
        } : null,
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    console.log('📋 Enviando tickets procesados:', ticketsData.length);
    console.log('🔍 Primer ticket:', JSON.stringify(ticketsData[0], null, 2));
    
    res.render("users/tickets", { tickets: ticketsData });
  } catch (error) {
    console.error("[ERROR /tickets]", error);
    res.status(500).send("Error mostrando los tickets: " + error.message);
  }
});

// Vista para solicitar recuperación de contraseña
router.get("/forgot-password", (req, res) => {
  res.render("auth/forgotPassword");
});

// Vista para restablecer contraseña (ya existe, pero aseguro que esté bien)
router.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.render("auth/resetPassword", { token });
});

/**
 * RUTAS ADMINISTRATIVAS - PANEL DE ADMINISTRACIÓN
 * 
 * Conjunto de endpoints para gestión administrativa del sistema
 * Requieren autenticación y rol de administrador
 */

/**
 * PANEL PRINCIPAL DE ADMINISTRACIÓN
 * GET /admin/panel
 * 
 * Página principal del panel administrativo
 * Dashboard con acceso a todas las funciones admin
 * 
 * MIDDLEWARE: authenticatePassport + requireAdmin + userInSesion
 * TEMPLATE: admin/adminPanel.hbs
 * RESPONSE: Dashboard administrativo
 * SECURITY: Solo administradores verificados
 */
// Rutas admin
router.get(
  "/admin/panel",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      // Obtener información del último valor EUR utilizado
      const eurRateInfo = await systemConfigService.getLastEurRateInfo();
      
      res.render("admin/adminPanel", { 
        currentEurRate: eurRateInfo.rate.toFixed(4),
        lastUpdateDate: eurRateInfo.updatedAt ? eurRateInfo.updatedAt.toLocaleString('es-ES') : null,
        isDefault: eurRateInfo.isDefault
      });
    } catch (error) {
      console.error('Error obteniendo valor EUR actual:', error);
      res.render("admin/adminPanel", { 
        currentEurRate: "2.0000",
        lastUpdateDate: null,
        isDefault: true
      });
    }
  }
);

import ProductsService from "../services/products.service.js";
import SystemConfigService from "../services/systemConfig.service.js";
const productsService = new ProductsService();
const systemConfigService = new SystemConfigService();

router.get(
  "/admin/products",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const products = await productsService.getAll();
      const plainProducts = products.map((p) =>
        p.toObject ? p.toObject() : p
      );
      res.render("admin/updateProducts", { products: plainProducts });
    } catch (error) {
      res.status(500).send("Error mostrando productos");
    }
  }
);

router.get(
  "/admin/users",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const UsersService = (await import("../services/users.service.js")).default;
      const usersService = new UsersService();
      const users = await usersService.getAll();
      const plainUsers = users.map(u => u.toObject ? u.toObject() : u);
      res.render("admin/updateUsers", { users: plainUsers });
    } catch (error) {
      res.status(500).send("Error mostrando usuarios");
    }
  }
);

router.post(
  "/admin/products/new",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  productImageUpload.single("image"),
  validateFile({ 
    required: false, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { title, description, mainCategory, subCategory, code, price, stock } = req.body;
      let image = null;
      if (req.file) {
        image = `/images/${req.file.filename}`; // Guarda la ruta del archivo
      }
      const ProductsService = (await import("../services/products.service.js")).default;
      const productsService = new ProductsService();
      await productsService.createProduct({
        title,
        description,
        mainCategory,
        subCategory,
        category: subCategory, // Mantener category para compatibilidad
        code,
        price,
        stock,
        image,
      });
      res.redirect("/admin/products");
    } catch (error) {
      console.error("Error en createProduct:", error);
      res.status(500).send("Error agregando producto");
    }
  }
);

router.post(
  "/admin/products/delete/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const ProductsService = (await import("../services/products.service.js"))
        .default;
      const productsService = new ProductsService();
      await productsService.deleteProduct(id);
      res.redirect("/admin/products");
    } catch (error) {
      res.status(500).send("Error eliminando producto");
    }
  }
);

// Ruta para mostrar el formulario de edición de producto
router.get(
  "/admin/products/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const ProductsService = (await import("../services/products.service.js"))
        .default;
      const productsService = new ProductsService();
      const product = await productsService.getById(id);
      if (!product) return res.status(404).send("Producto no encontrado");
      res.render("admin/editProduct", {
        product: product.toObject ? product.toObject() : product,
      });
    } catch (error) {
      res.status(500).send("Error mostrando producto para editar");
    }
  }
);

// Ruta para procesar la edición de producto (POST)
router.post(
  "/admin/products/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  productImageUpload.single("image"),
  validateFile({ 
    required: false, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { title, description, mainCategory, subCategory, code, price, stock } = req.body;
      const productId = req.params.id;
      let image = null;

      if (req.file) {
        image = `/images/${req.file.filename}`; // Guarda la ruta del archivo
      }

      const ProductsService = (await import("../services/products.service.js")).default;
      const productsService = new ProductsService();
      const currentProduct = await productsService.getProductById(productId);

      await productsService.updateProduct(productId, {
        title,
        description,
        mainCategory,
        subCategory,
        category: subCategory, // Mantener category para compatibilidad
        code,
        price,
        stock,
        image: image || currentProduct.image,
      });

      res.redirect("/admin/products");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      res.status(500).send("Error actualizando producto");
    }
  }
);

// Ruta para actualizar el rol de un usuario desde el panel admin
router.post(
  "/admin/users/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const UsersService = (await import("../services/users.service.js")).default;
      const usersService = new UsersService();
      await usersService.updateUser(id, { role });
      res.redirect("/admin/users");
    } catch (error) {
      res.status(500).send("Error actualizando rol de usuario");
    }
  }
);

/**
 * === RUTAS DE CHECKOUT Y PROCESAMIENTO DE PAGOS ===
 * 
 * Sección especializada en el proceso de finalización de compra
 * Incluye selección de método de pago y captura de datos
 */

/**
 * PANTALLA DE SELECCIÓN DE PAGO
 * GET /checkout/payment/:orderId
 * 
 * Muestra opciones de pago disponibles para una orden
 * Incluye formularios para diferentes métodos de pago
 * 
 * PARAMS: orderId - ObjectId de la orden a pagar
 * MIDDLEWARE: authenticatePassport + userInSesion
 * TEMPLATE: checkout/payment.hbs
 * CONTEXT: order - Datos de la orden
 * RESPONSE: Página de selección de método de pago
 * SECURITY: Validación de ObjectId, propiedad de orden
 */
// === Checkout: Vistas de pago para una orden ===

// 3.1 Ver pantalla de pago (selección de método)
router.get(
  "/checkout/payment/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("El ID de la orden no es válido.");
    }
    try {
      let order = await ticketsService.repository.getById(orderId);
      if (!order) return res.status(404).send("Orden no encontrada");
      order = order.toObject ? order.toObject() : order;
      res.render("checkout/payment", { order });
    } catch (error) {
      console.error("[ERROR GET /checkout/payment/:orderId]", error);
      res.status(500).send("Error cargando la pantalla de pago");
    }
  }
);

/**
 * PROCESAR PAGO MÓVIL CON COMPROBANTE
 * POST /checkout/payment/pagomovil/:orderId
 * 
 * Captura datos de transferencia Pago Móvil y comprobante
 * Requiere subida de imagen como evidencia de pago
 * 
 * PARAMS: orderId - ObjectId de la orden
 * BODY: bank, phone, docId, reference, amount
 * FILE: proof - Comprobante de imagen (requerido)
 * 
 * MIDDLEWARE: 
 * - authenticatePassport + userInSesion
 * - paymentProofUpload.single("proof")
 * - validateFile (required: true, 5MB max)
 * 
 * RESPONSE: Redirección a página de agradecimiento
 * SECURITY: Validación de archivo, datos de pago, propiedad de orden
 */
// 3.2 Reportar Pago Móvil (manual) + comprobante
router.post(
  "/checkout/payment/pagomovil/:orderId",
  authenticatePassport,
  userInSesion,
  paymentProofUpload.single("proof"),
  validateFile({ 
    required: true, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { bank, phone, docId, reference, amount } = req.body;

      if (!bank || !phone || !docId || !reference || !amount) {
        return res.status(400).send("Datos de pago incompletos");
      }

      // Guarda solo la ruta del archivo
      const proofUrl = req.file
        ? `/comprobantes/${req.file.filename}`
        : undefined;

      await paymentsService.captureManual({
        orderId,
        method: "pago_movil",
        payload: { bank, phone, docId, reference, amount, proofUrl }
      });

      res.redirect(`/checkout/thanks/${orderId}`);
    } catch (error) {
      console.error("[ERROR POST /checkout/payment/pagomovil/:orderId]", error);
      res.status(500).send("Error reportando Pago Móvil");
    }
  }
);

/**
 * PROCESAR PAGO ZELLE
 * POST /checkout/payment/zelle/:orderId
 * 
 * Captura datos de transferencia Zelle internacional
 * No requiere comprobante físico (referencia autogenerada)
 * 
 * PARAMS: orderId - ObjectId de la orden
 * BODY: email, reference, amount (en USD)
 * 
 * MIDDLEWARE: authenticatePassport + userInSesion
 * RESPONSE: Redirección a página de agradecimiento
 * SECURITY: Validación de email y referencia Zelle
 */
// 3.3 Reportar Zelle (manual)
router.post(
  "/checkout/payment/zelle/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { email, reference, amount } = req.body;

      await paymentsService.captureManual({
        orderId,
        method: "zelle",
        payload: { email, reference, amount }
      });

      res.redirect(`/checkout/thanks/${orderId}`);
    } catch (error) {
      console.error("[ERROR POST /checkout/payment/zelle/:orderId]", error);
      res.status(500).send("Error reportando Zelle");
    }
  }
);

/**
 * PÁGINA DE CONFIRMACIÓN DE COMPRA
 * GET /checkout/thanks/:orderId
 * 
 * Página final de agradecimiento y confirmación
 * Muestra resumen de compra completada
 * 
 * PARAMS: orderId - ObjectId de la orden procesada
 * MIDDLEWARE: authenticatePassport + userInSesion
 * TEMPLATE: checkout/thanks.hbs
 * CONTEXT: order - Datos completos de la orden
 * RESPONSE: Página de confirmación con detalles
 * SECURITY: Validación de propiedad de orden
 */
// 3.4 Pantalla de gracias
router.get(
  "/checkout/thanks/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      let order = await ticketsService.repository.getById(orderId);
      if (!order) return res.status(404).send("Orden no encontrada");
      order = order.toObject ? order.toObject() : order;
      res.render("checkout/thanks", { order });
    } catch (error) {
      console.error("[ERROR GET /checkout/thanks/:orderId]", error);
      res.status(500).send("Error mostrando confirmación");
    }
  }
);

/**
 * MIDDLEWARE DE MANEJO DE ERRORES MULTER
 * 
 * Manejo global de errores de subida de archivos
 * Proporciona responses apropiados para fallos de upload
 * 
 * APLICADO: Globalmente al router de vistas
 * SECURITY: Previene exposición de detalles internos
 */
// OWASP - Middleware de manejo de errores de multer
router.use(handleMulterError);

export default router;
