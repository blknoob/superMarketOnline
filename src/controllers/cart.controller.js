/**
 * CONTROLLER DE CARRITOS - GESTIÓN DE CARRITOS DE COMPRA
 * 
 * Módulo que exporta funciones para manejo de carritos tanto para vistas HTML
 * como para APIs JSON. Coordina operaciones entre frontend y CartsService.
 * 
 * ORGANIZACIÓN:
 * - FUNCIONES PARA VISTAS (HTML): Manejan redirecciones y renderizado
 * - FUNCIONES PARA APIs (JSON): Respuestas JSON para frontends SPA/mobile
 * - VISTA DEL CARRITO: Renderizado de template con datos del carrito
 * 
 * CARACTERÍSTICAS:
 * - Doble interfaz: HTML (redirects) y JSON (APIs)
 * - Manejo centralizado de errores con logging
 * - Autenticación requerida en todos los endpoints
 * - Validaciones de carrito vacío para checkout
 * - Transformación de datos para templates Handlebars
 * 
 * INTEGRACIONES:
 * - CartsService: Para lógica de negocio
 * - Express.js: Para manejo de requests/responses
 * - Handlebars: Para renderizado de templates
 */
import CartsService from "../services/carts.service.js";

const cartsService = new CartsService();

// === FUNCIONES PARA VISTAS (HTML) ===

/**
 * PROCESAR CHECKOUT (HTML)
 * 
 * Endpoint: POST /cart/checkout
 * Finaliza la compra del carrito y redirige a página de pago
 * 
 * PROCESO DE CHECKOUT:
 * 1. Obtener carrito del usuario autenticado
 * 2. Validar que el carrito no esté vacío
 * 3. Procesar compra via CartsService
 * 4. Generar ticket de compra
 * 5. Redirigir a página de pago con ticket ID
 * 
 * VALIDACIONES:
 * - Usuario autenticado (req.user)
 * - Carrito con productos (no vacío)
 * - Stock suficiente (manejado en service)
 * 
 * RESPUESTA EXITOSA:
 * - Redirige a /checkout/payment/{ticketId}
 * 
 * RESPUESTA ERROR:
 * - Status 400: "Carrito vacío"
 * - Status 500: Error en procesamiento
 * - Enviar mensaje de error como texto plano
 * 
 * @param {Object} req - Request con req.user del middleware de auth
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Redirección o mensaje de error
 */
export const processCheckout = async (req, res) => {
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    if (!cart.products || cart.products.length === 0) {
      return res.status(400).send("No puedes finalizar la compra con el carrito vacío.");
    }
    const order = await cartsService.processCartPurchase(cart._id, req.user);
    res.redirect(`/checkout/payment/${order.ticket._id}`);
  } catch (error) {
    console.error("[ERROR /cart/checkout]", error);
    res.status(500).send(error.message || "Error al finalizar la compra");
  }
};

/**
 * AGREGAR PRODUCTO AL CARRITO (HTML)
 * 
 * Endpoint: POST /cart/add
 * Añade un producto al carrito y redirige al home
 * 
 * BODY PARAMETERS:
 * - productId: ID del producto a agregar
 * 
 * PROCESO:
 * 1. Obtener carrito del usuario (crea si no existe)
 * 2. Agregar producto con cantidad 1
 * 3. Redirigir al home ("/")
 * 
 * CARACTERÍSTICAS:
 * - Cantidad fija de 1 unidad por click
 * - Si producto ya existe, suma cantidades
 * - Validación de stock en service
 * - Redirección automática al home
 * 
 * RESPUESTA EXITOSA:
 * - Redirige a "/" (home con mensaje de éxito)
 * 
 * RESPUESTA ERROR:
 * - Status 500 con mensaje de error
 * 
 * @param {Object} req - Request con productId en body y req.user
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Redirección o error
 */
export const addToCart = async (req, res) => {
  const productId = req.body.productId;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.addProductToCart(cart._id, productId, 1);
    res.redirect("/");
  } catch (error) {
    console.error("[ERROR /cart/add]", error);
    res.status(500).send("Error agregando producto al carrito");
  }
};

/**
 * QUITAR PRODUCTO DEL CARRITO (HTML)
 * 
 * Endpoint: POST /cart/remove
 * Elimina completamente un producto del carrito y redirige
 * 
 * BODY PARAMETERS:
 * - productId: ID del producto a eliminar
 * 
 * COMPORTAMIENTO:
 * - Elimina la línea completa del producto
 * - No importa la cantidad, se elimina totalmente
 * - Redirige a vista del carrito actualizada
 * 
 * CASOS DE USO:
 * - Botón "Eliminar" en vista del carrito
 * - Limpieza rápida de productos no deseados
 * 
 * RESPUESTA EXITOSA:
 * - Redirige a "/cart" (vista actualizada del carrito)
 * 
 * RESPUESTA ERROR:
 * - Status 500 con mensaje de error
 * 
 * @param {Object} req - Request con productId en body y req.user
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Redirección o error
 */
export const removeFromCart = async (req, res) => {
  const productId = req.body.productId;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.removeProductToCart(cart._id, productId);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/remove]", error);
    res.status(500).send("Error quitando producto del carrito");
  }
};

/**
 * ACTUALIZAR CANTIDAD DE PRODUCTO (HTML)
 * 
 * Endpoint: POST /cart/update
 * Modifica la cantidad de un producto en el carrito
 * 
 * BODY PARAMETERS:
 * - productId: ID del producto a actualizar
 * - quantity: Nueva cantidad (number)
 * 
 * LÓGICA DE ACTUALIZACIÓN:
 * - Si quantity > 0: actualiza a nueva cantidad
 * - Si quantity = 0: elimina el producto del carrito
 * - Validación de stock en service
 * 
 * CASOS DE USO:
 * - Inputs de cantidad en vista del carrito
 * - Botones +/- para ajustar cantidades
 * - Formularios de actualización masiva
 * 
 * RESPUESTA EXITOSA:
 * - Redirige a "/cart" con carrito actualizado
 * 
 * RESPUESTA ERROR:
 * - Status 500 con mensaje de error
 * 
 * @param {Object} req - Request con productId y quantity en body
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Redirección o error
 */
export const updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.updateProductQuantity(cart._id, productId, quantity);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/update]", error);
    res.status(500).send("Error actualizando cantidad del producto");
  }
};

/**
 * VACIAR CARRITO COMPLETAMENTE (HTML)
 * 
 * Endpoint: POST /cart/clear
 * Elimina todos los productos del carrito
 * 
 * COMPORTAMIENTO:
 * - Vacía completamente el array de productos
 * - Mantiene el carrito (no lo elimina)
 * - Redirige a vista del carrito vacío
 * 
 * CASOS DE USO:
 * - Botón "Vaciar carrito" en vista del carrito
 * - Reset rápido antes de nueva selección
 * - Limpieza administrativa
 * 
 * RESPUESTA EXITOSA:
 * - Redirige a "/cart" (carrito vacío)
 * 
 * RESPUESTA ERROR:
 * - Status 500 con mensaje de error
 * 
 * @param {Object} req - Request con req.user del middleware
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Redirección o error
 */
export const clearCart = async (req, res) => {
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.clearCart(cart._id);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/clear]", error);
    res.status(500).send("Error vaciando el carrito");
  }
};

// === FUNCIONES PARA APIs (JSON) ===

/**
 * OBTENER CARRITO (API JSON)
 * 
 * Endpoint: GET /api/cart
 * Retorna los datos del carrito en formato JSON
 * 
 * RESPUESTA INCLUYE:
 * - Datos completos del carrito
 * - Productos con información poblada
 * - Cantidades y totales
 * - Metadatos del carrito
 * 
 * CASOS DE USO:
 * - APIs para aplicaciones SPA
 * - Aplicaciones móviles
 * - Integraciones con otros sistemas
 * - AJAX calls desde frontend
 * 
 * @param {Object} req - Request con req.user del middleware
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} JSON con carrito o error
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    res.json({ status: "success", cart });
  } catch (error) {
    console.error("[ERROR getCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const addProductToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.addProductToCart(cart._id, productId, quantity);

    res.json({ status: "success", message: "Producto agregado al carrito", cart: result });
  } catch (error) {
    console.error("[ERROR addProductToCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateProductQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.updateProductQuantity(cart._id, productId, quantity);

    res.json({ status: "success", message: "Cantidad actualizada", cart: result });
  } catch (error) {
    console.error("[ERROR updateProductQuantity]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const removeProductFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.removeProductToCart(cart._id, productId);

    res.json({ status: "success", message: "Producto removido del carrito", cart: result });
  } catch (error) {
    console.error("[ERROR removeProductFromCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const clearUserCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.clearCart(cart._id);

    res.json({ status: "success", message: "Carrito vaciado", cart: result });
  } catch (error) {
    console.error("[ERROR clearUserCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const purchaseCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.processCartPurchase(cart._id, req.user);

    res.json({ status: "success", message: "Compra procesada exitosamente", result });
  } catch (error) {
    console.error("[ERROR purchaseCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === FUNCIÓN PARA VISTA DEL CARRITO ===

/**
 * RENDERIZAR VISTA DEL CARRITO
 * 
 * Endpoint: GET /cart
 * Renderiza la página HTML del carrito con productos
 * 
 * TRANSFORMACIÓN PARA HANDLEBARS:
 * - Convierte documentos Mongoose a objetos planos
 * - Transforma productos anidados para template
 * - Asegura compatibilidad con Handlebars helpers
 * 
 * TEMPLATE RENDERIZADO:
 * - "users/cart" con variable cart
 * - Incluye productos, cantidades, precios
 * - Botones para actualizar cantidades
 * - Enlaces para eliminar productos
 * - Botón de checkout
 * 
 * DATOS PASADOS AL TEMPLATE:
 * - cart: Objeto plano con productos transformados
 * - Cada producto incluye: _id, title, price, image, etc.
 * - Cantidades y subtotales calculados
 * 
 * RESPUESTA EXITOSA:
 * - Renderiza template "users/cart.hbs"
 * 
 * RESPUESTA ERROR:
 * - Status 500 con mensaje de error
 * 
 * @param {Object} req - Request con req.user del middleware
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Template renderizado o error
 */
export const getCartView = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);

    // Convertir a objeto plano para Handlebars
    let plainCart = cart && cart.toObject ? cart.toObject() : cart;
    if (plainCart && Array.isArray(plainCart.products)) {
      plainCart.products = plainCart.products.map((item) => {
        const prod = item.product && item.product.toObject
          ? item.product.toObject()
          : item.product;
        return { ...item, product: prod };
      });
    }

    res.render("users/cart", { cart: plainCart });
  } catch (error) {
    console.error("[ERROR getCartView]", error);
    res.status(500).send("Error mostrando el carrito");
  }
};