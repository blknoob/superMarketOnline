/**
 * REPOSITORY DE USUARIOS - GESTIÓN DE AUTENTICACIÓN Y PERFILES
 * 
 * Repository que maneja todas las operaciones relacionadas con usuarios del sistema
 * Actúa como capa de abstracción entre Services y DAOs para el sistema de usuarios
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa de usuarios (CRUD)
 * - Autenticación y login de usuarios
 * - Recuperación de contraseñas con tokens
 * - Búsquedas especializadas (email, token)
 * - Operaciones administrativas
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Búsqueda segura por email para login
 * - Validación de tokens de recuperación
 * - Gestión de perfiles de usuario
 * - Control de roles y permisos
 * 
 * CASOS DE USO:
 * - Registro de nuevos usuarios
 * - Proceso de autenticación/login
 * - Actualización de perfiles de usuario
 * - Recuperación de contraseñas olvidadas
 * - Gestión administrativa de usuarios
 * 
 * PATRÓN ARQUITECTURAL:
 * Controller → Service → Repository → DAO → Model → MongoDB
 */

import UsersDAO from "./daos/mongo/users.dao.js";

/**
 * CLASE REPOSITORY PARA USUARIOS
 * Proporciona interface unificada para todas las operaciones de usuarios
 */
class UsersRepository {
  /**
   * CONSTRUCTOR
   * Inicializa el repository con una instancia del DAO de usuarios
   */
  constructor() {
    this.dao = new UsersDAO();
  }

  /**
   * BUSCAR USUARIO POR ID
   * 
   * Obtiene un usuario específico usando su ObjectId
   * Se usa para mostrar perfiles y validaciones internas
   * 
   * @param {string|ObjectId} id - ID del usuario a buscar
   * @returns {Promise<Object|null>} Usuario encontrado o null
   * @throws {Error} Si hay errores de validación o acceso
   */
  async findById(id) {
    try {
      return await this.dao.findById(id);
    } catch (error) {
      throw new Error(`Error buscando usuario por ID: ${error.message}`);
    }
  }

  /**
   * BUSCAR USUARIO POR EMAIL (LOGIN)
   * 
   * Método principal para autenticación de usuarios
   * Busca usuario por su email único para verificar credenciales
   * 
   * IMPORTANTE: Este método SÍ incluye el campo password
   * para permitir verificación durante el proceso de login
   * 
   * @param {string} email - Email del usuario (identificador único)
   * @returns {Promise<Object|null>} Usuario con password incluido o null
   * @throws {Error} Si hay errores de consulta
   */
  async findByEmail(email) {
    try {
      return await this.dao.findByEmail(email);
    } catch (error) {
      throw new Error(`Error buscando usuario por email: ${error.message}`);
    }
  }

  /**
   * BUSCAR USUARIO POR TOKEN DE RECUPERACIÓN
   * 
   * Encuentra usuario usando token de recuperación de contraseña
   * Verifica automáticamente que el token no haya expirado
   * 
   * Proceso de validación automática:
   * 1. Token debe coincidir exactamente
   * 2. Fecha de expiración debe ser mayor a la fecha actual
   * 3. Solo retorna usuario si ambas condiciones se cumplen
   * 
   * @param {string} token - Token de recuperación generado previamente
   * @returns {Promise<Object|null>} Usuario con token válido o null si expirado/inválido
   * @throws {Error} Si hay errores de consulta
   */
  async findByResetToken(token) {
    try {
      return await this.dao.findByResetToken(token);
    } catch (error) {
      throw new Error(`Error buscando usuario por token: ${error.message}`);
    }
  }

  /**
   * CREAR NUEVO USUARIO (REGISTRO)
   * 
   * Registra un nuevo usuario en el sistema
   * Proceso típico de registro con validaciones automáticas
   * 
   * IMPORTANTE: La contraseña debe llegar YA HASHEADA desde el Service
   * Este repository NO hashea contraseñas, es responsabilidad del Service
   * 
   * @param {Object} userData - Datos completos del nuevo usuario
   * @param {string} userData.first_name - Nombre del usuario
   * @param {string} userData.last_name - Apellido del usuario
   * @param {string} userData.email - Email único (usado como username)
   * @param {number} userData.age - Edad (validada: 13-120 años)
   * @param {string} userData.password - Contraseña YA HASHEADA
   * @param {string} [userData.role="user"] - Rol del usuario
   * @returns {Promise<Object>} Usuario creado (sin campo password en respuesta)
   * @throws {Error} Si email ya existe o hay errores de validación
   */
  async create(userData) {
    try {
      return await this.dao.create(userData);
    } catch (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR USUARIO EXISTENTE
   * 
   * Modifica datos de un usuario en el sistema
   * Se usa para múltiples propósitos según el contexto
   * 
   * Casos de uso comunes:
   * - Actualizar perfil (nombre, edad)
   * - Cambiar rol (operaciones admin)
   * - Establecer tokens de recuperación de contraseña
   * - Limpiar tokens después de uso exitoso
   * - Actualizar contraseña (debe venir hasheada)
   * 
   * @param {string|ObjectId} id - ID del usuario a actualizar
   * @param {Object} userData - Campos a actualizar (datos parciales)
   * @returns {Promise<Object|null>} Usuario actualizado o null si no existe
   * @throws {Error} Si hay errores de validación o usuario no encontrado
   */
  async update(id, userData) {
    try {
      return await this.dao.update(id, userData);
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  /**
   * ELIMINAR USUARIO
   * 
   * Elimina completamente un usuario del sistema
   * ⚠️ OPERACIÓN EXTREMADAMENTE CRÍTICA ⚠️
   * 
   * ADVERTENCIAS IMPORTANTES:
   * - Esta operación es IRREVERSIBLE
   * - Puede causar problemas en carritos, tickets y órdenes relacionadas
   * - Puede romper integridad referencial
   * - Considerar "soft delete" (marcar como inactivo) como alternativa
   * 
   * Verificaciones recomendadas antes de ejecutar:
   * - Usuario no tiene carritos activos
   * - Usuario no tiene órdenes pendientes
   * - Usuario no tiene tickets recientes
   * 
   * @param {string|ObjectId} id - ID del usuario a eliminar
   * @returns {Promise<Object|null>} Usuario eliminado o null
   * @throws {Error} Si hay errores de acceso o dependencias
   */
  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS USUARIOS (ADMIN)
   * 
   * Lista completa de usuarios del sistema
   * Función exclusivamente administrativa
   * 
   * Usos administrativos:
   * - Panel de administración de usuarios
   * - Reportes de usuarios registrados
   * - Gestión de roles y permisos
   * - Análisis de base de usuarios
   * 
   * NOTA DE SEGURIDAD: No incluye contraseñas en la respuesta
   * NOTA DE RENDIMIENTO: En producción debería implementar paginación
   * 
   * @returns {Promise<Array>} Array de todos los usuarios (sin passwords)
   * @throws {Error} Si hay errores de conexión o consulta
   */
  async findAll() {
    try {
      return await this.dao.findAll();
    } catch (error) {
      throw new Error(`Error buscando usuarios: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL REPOSITORY DE USUARIOS
 * 
 * Se exporta la clase para instanciación en Services
 * El repository de usuarios es fundamental para la seguridad del sistema
 */
export default UsersRepository;
