/**
 * CONTROLLER DE ADMINISTRACIÓN - GESTIÓN AVANZADA DE USUARIOS
 * 
 * Controller especializado para operaciones administrativas del sistema
 * Proporciona endpoints privilegiados para gestión completa de usuarios
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - CRUD completo de usuarios (Create, Read, Update, Delete)
 * - Gestión de roles y permisos
 * - Consultas administrativas de usuarios
 * - Operaciones masivas y privilegiadas
 * 
 * PERMISOS REQUERIDOS:
 * - Acceso exclusivo para administradores
 * - Validación de roles en middleware
 * - Operaciones sensibles del sistema
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - DTOs para filtrar información sensible
 * - Validación exhaustiva de datos
 * - Logs de auditoría para cambios críticos
 * - Rate limiting para prevenir abusos
 * 
 * ENDPOINTS ADMINISTRATIVOS:
 * - GET /admin/users - Listar todos los usuarios
 * - GET /admin/users/:id - Consultar usuario específico
 * - POST /admin/users - Crear usuario desde admin
 * - PUT /admin/users/:id - Actualizar datos de usuario
 * - DELETE /admin/users/:id - Eliminar usuario
 * - PATCH /admin/users/:id/role - Cambiar rol de usuario
 */
import UserDTO from "../dtos/user.dto.js";
import UsersService from "../services/users.service.js";

const usersService = new UsersService();

/**
 * CONTROLLER ADMINISTRATIVO
 * 
 * Clase que encapsula operaciones de administración del sistema
 * Especializado en gestión avanzada de usuarios y permisos
 * 
 * RESPONSABILIDADES:
 * - Operaciones CRUD con privilegios elevados
 * - Gestión de roles y permisos
 * - Validaciones administrativas
 * - Formateo de respuestas con DTOs
 * 
 * PATRON IMPLEMENTADO:
 * - Admin Pattern: Separación de lógica administrativa
 * - DTO Pattern: Filtrado de datos sensibles
 * - Error Handling: Manejo robusto de excepciones
 */
class AdminController {
  /**
   * OBTENER TODOS LOS USUARIOS (ADMIN)
   * 
   * Endpoint: GET /admin/users
   * Retorna lista completa de usuarios del sistema para administración
   * 
   * CARACTERÍSTICAS ADMINISTRATIVAS:
   * - Acceso a todos los usuarios sin filtros
   * - Información completa mediante UserDTO
   * - Incluye usuarios activos e inactivos
   * - No hay límites de paginación
   * 
   * SEGURIDAD:
   * - Requiere rol de administrador
   * - Datos sensibles filtrados por DTO
   * - Log de acceso para auditoría
   * 
   * USO PRINCIPAL:
   * - Panel de administración
   * - Reportes de usuarios
   * - Gestión masiva de cuentas
   * - Análisis demográfico
   * 
   * FORMATO DE RESPUESTA:
   * - Array de usuarios con UserDTO aplicado
   * - Sin contraseñas ni tokens
   * - Metadatos de perfil incluidos
   * 
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con array de usuarios filtrados
   */
  async getAllUsers(req, res) {
    try {
      const users = await usersService.getAll();
      res.json({
        status: "success",
        users: users.map((user) => new UserDTO(user)),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * OBTENER USUARIO POR ID (ADMIN)
   * 
   * Endpoint: GET /admin/users/:id
   * Busca y retorna información detallada de usuario específico
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del usuario a consultar
   * 
   * VENTAJAS ADMINISTRATIVAS:
   * - Acceso a cualquier usuario del sistema
   * - Información completa de perfil
   * - Historial de actividad (si aplica)
   * - Estados de verificación y suspensión
   * 
   * VALIDACIONES:
   * - ID debe ser ObjectId válido
   * - Usuario debe existir en sistema
   * - Error 404 con mensaje descriptivo
   * 
   * CASOS DE USO:
   * - Investigación de reportes de usuario
   * - Verificación de datos para soporte
   * - Auditoría de perfiles sospechosos
   * - Actualización dirigida de información
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con usuario o error 404
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await usersService.getById(id);

      if (user.error) {
        return res.status(user.type || 500).json({
          status: "error",
          message: user.message,
        });
      }

      res.json({
        status: "success",
        user: new UserDTO(user),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * CREAR USUARIO (ADMIN)
   * 
   * Endpoint: POST /admin/users
   * Crea nuevo usuario con privilegios administrativos
   * 
   * BODY PARAMETERS:
   * - first_name: Nombre del usuario (requerido)
   * - last_name: Apellido del usuario (requerido)
   * - email: Email único (requerido)
   * - password: Contraseña (requerido)
   * - age: Edad del usuario (opcional)
   * - role: Rol asignado (opcional, default: user)
   * 
   * VENTAJAS ADMINISTRATIVAS:
   * - Asignación directa de roles
   * - Sin necesidad de verificación de email
   * - Creación masiva permitida
   * - Bypass de restricciones normales
   * 
   * VALIDACIONES:
   * - Campos obligatorios presentes
   * - Email único en sistema
   * - Formato de email válido
   * - Rol válido si se especifica
   * 
   * PROCESO:
   * 1. Validar datos de entrada
   * 2. Verificar unicidad de email
   * 3. Hash de contraseña
   * 4. Crear usuario en base de datos
   * 5. Retornar usuario con DTO aplicado
   * 
   * @param {Object} req - Request con body data del usuario
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con usuario creado (201)
   */
  async createUser(req, res) {
    try {
      const { first_name, last_name, email, password, role, age } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Faltan campos obligatorios",
        });
      }

      const response = await usersService.createUser({
        first_name,
        last_name,
        email,
        password,
        age,
        role,
      });

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.status(201).json({
        status: "created",
        message: "Usuario creado correctamente",
        user: new UserDTO(response),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * ACTUALIZAR USUARIO (ADMIN)
   * 
   * Endpoint: PUT /admin/users/:id
   * Actualiza datos de usuario con privilegios administrativos
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del usuario a actualizar
   * - updateData (Body): Campos a modificar
   * 
   * CAMPOS ACTUALIZABLES:
   * - Información personal (nombre, apellido, edad)
   * - Configuraciones de perfil
   * - Estados de verificación
   * - Metadatos administrativos
   * 
   * PRIVILEGIOS ADMINISTRATIVOS:
   * - Modificación sin restricciones de propiedad
   * - Actualización de campos protegidos
   * - Bypass de validaciones de usuario normal
   * - Registro de cambios para auditoría
   * 
   * VALIDACIONES:
   * - ID de usuario requerido y válido
   * - Al menos un campo a actualizar
   * - Datos válidos según esquema
   * - Email único si se modifica
   * 
   * SEGURIDAD:
   * - No permite cambio directo de contraseña
   * - Validación de tipos de datos
   * - Log de cambios administrativos
   * 
   * @param {Object} req - Request con params.id y body updateData
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con confirmación de actualización
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "ID de usuario requerido",
        });
      }

      const response = await usersService.updateUser(id, updateData);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({
        status: "success",
        message: response.message,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * ELIMINAR USUARIO (ADMIN)
   * 
   * Endpoint: DELETE /admin/users/:id
   * Elimina usuario del sistema con privilegios administrativos
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del usuario a eliminar
   * 
   * PROCESO DE ELIMINACIÓN:
   * 1. Verificar existencia del usuario
   * 2. Validar que no sea el último admin
   * 3. Limpiar datos relacionados (carritos, pedidos)
   * 4. Eliminar usuario de base de datos
   * 5. Registrar acción en logs de auditoría
   * 
   * CONSIDERACIONES DE INTEGRIDAD:
   * - Manejo de relaciones con pedidos existentes
   * - Preservación de tickets históricos
   * - Limpieza de carritos activos
   * - Notificaciones de eliminación
   * 
   * VALIDACIONES:
   * - ID requerido y válido
   * - Usuario debe existir
   * - No auto-eliminación de admin
   * - Verificación de permisos
   * 
   * SEGURIDAD:
   * - Confirmación implícita requerida
   * - Log completo de la acción
   * - Backup de datos antes de eliminar
   * 
   * @param {Object} req - Request con params.id
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con confirmación de eliminación
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "ID de usuario requerido",
        });
      }

      const response = await usersService.deleteUser(id);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({
        status: "success",
        message: response.message,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * CAMBIAR ROL DE USUARIO (ADMIN)
   * 
   * Endpoint: PATCH /admin/users/:id/role
   * Modifica el rol de un usuario con privilegios administrativos
   * 
   * PARÁMETROS:
   * - id (URL): ObjectId del usuario objetivo
   * - role (Body): Nuevo rol a asignar
   * 
   * ROLES DISPONIBLES:
   * - 'user': Usuario estándar con permisos básicos
   * - 'premium': Usuario con beneficios adicionales
   * - 'admin': Administrador con acceso completo
   * 
   * VALIDACIONES DE ROLES:
   * - Rol debe existir en sistema
   * - No degradar último administrador
   * - Verificar permisos del solicitante
   * - Confirmar cambios críticos
   * 
   * PROCESO:
   * 1. Validar parámetros de entrada
   * 2. Verificar existencia de usuario
   * 3. Validar nuevo rol
   * 4. Aplicar cambio de rol
   * 5. Registrar en auditoría
   * 6. Retornar usuario actualizado
   * 
   * IMPLICACIONES DEL CAMBIO:
   * - Actualización inmediata de permisos
   * - Posible invalidación de sesión
   * - Notificación al usuario afectado
   * - Log de seguridad
   * 
   * @param {Object} req - Request con params.id y body.role
   * @param {Object} res - Response de Express
   * @returns {Promise<Object>} JSON con usuario actualizado
   */
  async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!id || !role) {
        return res.status(400).json({
          status: "error",
          message: "ID de usuario y nuevo role son requeridos",
        });
      }

      const response = await usersService.changeUserRole(id, role);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({
        status: "success",
        message: "Role actualizado correctamente",
        user: new UserDTO(response),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }
}

export default AdminController;
