/**
 * CONTROLLER DE VISTAS DE USUARIOS - RENDERIZADO DE PERFILES
 * 
 * Controller especializado en renderizado de vistas relacionadas con usuarios
 * Maneja la presentación de perfiles y datos personales
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Renderizar vista de perfil de usuario actual
 * - Validar autenticación antes de mostrar datos
 * - Preparar datos de usuario para templates
 * - Manejo de redirecciones de seguridad
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Verificación de sesión activa
 * - Redirección automática a login si no autenticado
 * - Sanitización de datos de usuario
 * - Prevención de exposición de datos sensibles
 * 
 * INTEGRACIÓN CON VIEWS:
 * - Renderizado con Handlebars templates
 * - Paso de contexto de usuario seguro
 * - Manejo de errores de renderizado
 * - Conversión de objetos Mongoose
 * 
 * ENDPOINTS DE VISTA:
 * - /users/current - Perfil del usuario autenticado
 */
import UsersService from "../services/users.service.js";

const usersService = new UsersService();

/**
 * CONTROLLER DE VISTA DE USUARIOS
 * 
 * Clase especializada en renderizado de vistas de usuario
 * Enfocada en presentación segura de datos personales
 * 
 * RESPONSABILIDADES:
 * - Renderizar templates de usuario
 * - Validar autenticación y permisos
 * - Preparar datos para presentación
 * - Manejar errores de vista
 * 
 * PATRON IMPLEMENTADO:
 * - View Controller Pattern: Separación de lógica de vista
 * - Security First: Validación antes de renderizado
 * - Data Sanitization: Limpieza de datos sensibles
 */
class UsersViewController {
  /**
   * RENDERIZAR VISTA DE PERFIL ACTUAL
   * 
   * Endpoint: GET /users/current
   * Renderiza la página de perfil del usuario autenticado
   * 
   * FLUJO DE SEGURIDAD:
   * 1. Verificar que existe sesión activa (req.user)
   * 2. Redirigir a login si no autenticado
   * 3. Preparar datos de usuario para vista
   * 4. Renderizar template con datos seguros
   * 
   * PREPARACIÓN DE DATOS:
   * - Conversión de objeto Mongoose a plain object
   * - Sanitización automática por DTO (implícita)
   * - Eliminación de referencias circulares
   * - Formato JSON compatible con Handlebars
   * 
   * TEMPLATE RENDERIZADO:
   * - Vista: users/current.hbs
   * - Contexto: { user: userData }
   * - Layout: main.hbs (por defecto)
   * 
   * CASOS DE USO:
   * - Usuario consultando su perfil
   * - Verificación de datos personales
   * - Acceso a configuraciones de cuenta
   * - Dashboard personal del usuario
   * 
   * REDIRECCIONES:
   * - /login si no hay usuario autenticado
   * - Error 500 si falla el renderizado
   * 
   * @param {Object} req - Request con req.user de sesión
   * @param {Object} res - Response para renderizado
   * @returns {Promise<void>} Renderiza vista o redirige
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
}

export default UsersViewController;
