/**
 * CONTROLLER DE VISTAS ADMINISTRATIVAS - RENDERIZADO DE PANELES DE ADMIN
 * 
 * Controller especializado en renderizado de vistas administrativas
 * Maneja la presentación de interfaces de administración del sistema
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Renderizar panel de gestión de usuarios
 * - Mostrar detalles de usuario para administración
 * - Preparar datos para templates administrativos
 * - Interfaces de control del sistema
 * 
 * CARACTERÍSTICAS ADMINISTRATIVAS:
 * - Acceso exclusivo para administradores
 * - Vistas de gestión completa
 * - Datos de todos los usuarios sin filtros
 * - Interfaces de edición y actualización
 * 
 * INTEGRACIÓN CON VIEWS:
 * - Templates en views/admin/
 * - Contexto completo para administración
 * - Herramientas de gestión integradas
 * - Layout administrativo especializado
 * 
 * ENDPOINTS DE VISTA:
 * - /admin/users - Panel de gestión de usuarios
 * - /admin/users/:id - Detalle de usuario para edición
 * 
 * SEGURIDAD:
 * - Middleware de autenticación requerido
 * - Validación de rol administrativo
 * - Acceso controlado a datos sensibles
 */
import UsersService from "../services/users.service.js";

const usersService = new UsersService();

/**
 * CONTROLLER DE VISTA ADMINISTRATIVA
 * 
 * Clase especializada en renderizado de interfaces administrativas
 * Enfocada en herramientas de gestión del sistema
 * 
 * RESPONSABILIDADES:
 * - Renderizar paneles de administración
 * - Preparar datos para gestión
 * - Proporcionar interfaces de control
 * - Manejar errores administrativos
 * 
 * PATRON IMPLEMENTADO:
 * - Admin View Pattern: Interfaces especializadas de administración
 * - Data Preparation: Conversión para herramientas de gestión
 * - Security First: Acceso controlado y validado
 */
class AdminViewController {
  /**
   * RENDERIZAR PANEL DE GESTIÓN DE USUARIOS
   * 
   * Endpoint: GET /admin/users
   * Renderiza interfaz administrativa para gestión de usuarios
   * 
   * FUNCIONALIDADES DEL PANEL:
   * - Lista completa de usuarios del sistema
   * - Herramientas de edición y eliminación
   * - Cambio de roles y permisos
   * - Búsqueda y filtrado de usuarios
   * 
   * PROCESO DE RENDERIZADO:
   * 1. Obtener todos los usuarios del sistema
   * 2. Convertir objetos Mongoose a plain objects
   * 3. Preparar contexto para herramientas administrativas
   * 4. Renderizar template de administración
   * 
   * TEMPLATE UTILIZADO:
   * - Vista: admin/updateUsers.hbs
   * - Contexto: { users: plainUsers }
   * - Herramientas CRUD integradas
   * - Interfaz de administración completa
   * 
   * HERRAMIENTAS DISPONIBLES:
   * - Tabla de usuarios con datos completos
   * - Botones de edición rápida
   * - Cambio de roles dinámico
   * - Eliminación con confirmación
   * - Filtros de búsqueda
   * 
   * ACCESO:
   * - Exclusivo para administradores
   * - Middleware de autenticación requerido
   * - Validación de permisos administrativos
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response para renderizado
   * @returns {Promise<void>} Renderiza panel administrativo o error 500
   */
  async getAllUsersView(req, res) {
    try {
      const users = await usersService.getAll();
      const plainUsers = users.map((u) => (u.toObject ? u.toObject() : u));
      res.render("admin/updateUsers", { users: plainUsers });
    } catch (error) {
      res.status(500).send("Error mostrando usuarios");
    }
  }

  /**
   * RENDERIZAR DETALLE DE USUARIO PARA ADMINISTRACIÓN
   * 
   * Endpoint: GET /admin/users/:id
   * Renderiza vista detallada de usuario con herramientas administrativas
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del usuario a administrar
   * 
   * FUNCIONALIDADES ADMINISTRATIVAS:
   * - Vista completa de perfil de usuario
   * - Formularios de edición de datos
   * - Cambio de rol y permisos
   * - Historial de actividad (si aplica)
   * - Herramientas de moderación
   * 
   * PROCESO DE RENDERIZADO:
   * 1. Extraer ID del usuario de parámetros
   * 2. Buscar usuario en servicio por ID
   * 3. Validar existencia (404 si no existe)
   * 4. Convertir a plain object
   * 5. Renderizar vista de administración
   * 
   * VALIDACIONES:
   * - ID debe estar presente
   * - Usuario debe existir
   * - Permisos administrativos requeridos
   * - Error 404 si usuario no encontrado
   * 
   * TEMPLATE UTILIZADO:
   * - Vista: admin/userDetail.hbs
   * - Contexto: { user: userData }
   * - Formularios de edición integrados
   * - Controles administrativos
   * 
   * HERRAMIENTAS INCLUIDAS:
   * - Edición de datos personales
   * - Cambio de contraseña (admin)
   * - Gestión de roles
   * - Suspensión/activación de cuenta
   * - Historial de acciones
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response para renderizado
   * @returns {Promise<void>} Renderiza detalle administrativo o error 404/500
   */
  async getUserDetailView(req, res) {
    try {
      const { id } = req.params;
      const user = await usersService.getById(id);
      if (!user) return res.status(404).send("Usuario no encontrado");
      res.render("admin/userDetail", {
        user: user.toObject ? user.toObject() : user,
      });
    } catch (error) {
      res.status(500).send("Error mostrando usuario");
    }
  }
}

export default AdminViewController;
