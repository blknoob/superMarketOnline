/**
 * DAO DE USUARIOS - GESTIÓN DE AUTENTICACIÓN Y PERFILES
 * 
 * Data Access Object para todas las operaciones de usuarios en el sistema
 * Maneja autenticación, autorización, perfiles y recuperación de contraseñas
 * 
 * Funcionalidades principales:
 * - CRUD completo de usuarios
 * - Búsquedas por email (login)
 * - Gestión de tokens de recuperación de contraseña
 * - Validaciones de seguridad
 * - Operaciones administrativas
 * 
 * Consideraciones de seguridad:
 * - Los passwords se almacenan hasheados (nunca texto plano)
 * - Tokens de recuperación con expiración temporal
 * - Validación de emails únicos
 * - Control de roles y permisos
 */

import User from "./models/users.model.js";

/**
 * CLASE DAO PARA USUARIOS
 * Implementa todas las operaciones de persistencia del sistema de usuarios
 */
class UsersDAO {

  /**
   * CREAR NUEVO USUARIO (REGISTRO)
   * 
   * Registra un nuevo usuario en el sistema
   * Valida datos según schema antes de crear
   * 
   * IMPORTANTE: La contraseña debe llegar ya hasheada desde el Service
   * Este método NO hashea contraseñas, es responsabilidad de capas superiores
   * 
   * @param {Object} userData - Datos completos del usuario
   * @param {string} userData.first_name - Nombre del usuario
   * @param {string} userData.last_name - Apellido del usuario  
   * @param {string} userData.email - Email único (usado como username)
   * @param {number} userData.age - Edad (validada: 13-120 años)
   * @param {string} userData.password - Contraseña YA HASHEADA
   * @param {string} [userData.role="user"] - Rol del usuario
   * @returns {Promise<Object>} Usuario creado (sin campo password)
   * @throws {Error} Si email ya existe o hay errores de validación
   */
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  /**
   * BUSCAR USUARIO POR ID
   * 
   * Obtiene un usuario específico usando su ObjectId
   * Método básico para operaciones internas y perfiles
   * 
   * @param {string|ObjectId} id - ID del usuario a buscar
   * @returns {Promise<Object|null>} Usuario encontrado o null
   * @throws {Error} Si el ID es inválido o hay errores de DB
   */
  async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  /**
   * BUSCAR USUARIO POR EMAIL (LOGIN)
   * 
   * Método principal para autenticación
   * Busca usuario por su email único para verificar credenciales
   * 
   * IMPORTANTE: Este método SÍ incluye el campo password
   * para verificación durante el login
   * 
   * @param {string} email - Email del usuario (case insensitive)
   * @returns {Promise<Object|null>} Usuario con password incluido o null
   * @throws {Error} Si hay errores de DB
   */
  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }

  /**
   * BUSCAR USUARIO POR TOKEN DE RECUPERACIÓN
   * 
   * Encuentra usuario usando token de recuperación de contraseña
   * Verifica automáticamente que el token no haya expirado
   * 
   * Proceso de verificación:
   * 1. Token debe coincidir exactamente
   * 2. Fecha de expiración debe ser mayor a la fecha actual
   * 3. Solo devuelve usuario si ambas condiciones se cumplen
   * 
   * @param {string} token - Token de recuperación generado previamente
   * @returns {Promise<Object|null>} Usuario con token válido o null
   * @throws {Error} Si hay errores de DB
   */
  async findByResetToken(token) {
    try {
      return await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Token no expirado
      });
    } catch (error) {
      throw new Error(`Error al buscar usuario por token: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS USUARIOS (ADMIN)
   * 
   * Lista completa de usuarios del sistema
   * Función administrativa para gestión de usuarios
   * 
   * NOTA: En producción debería tener paginación para mejor rendimiento
   * NOTA: No incluye contraseñas en la respuesta por seguridad
   * 
   * @returns {Promise<Array>} Array con todos los usuarios
   * @throws {Error} Si hay errores de conexión DB
   */
  async findAll() {
    try {
      return await User.find({});
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * ACTUALIZAR USUARIO
   * 
   * Actualiza datos de un usuario existente
   * Ejecuta validaciones del schema antes de guardar
   * 
   * Usos comunes:
   * - Actualizar perfil (nombre, edad)
   * - Cambiar rol (admin operations)
   * - Establecer tokens de recuperación
   * - Limpiar tokens después de uso
   * 
   * @param {string|ObjectId} id - ID del usuario a actualizar
   * @param {Object} updateData - Campos a actualizar (parcial)
   * @returns {Promise<Object|null>} Usuario actualizado o null
   * @throws {Error} Si hay errores de validación o usuario no existe
   */
  async update(id, updateData) {
    try {
      return await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  /**
   * ELIMINAR USUARIO
   * 
   * Elimina completamente un usuario del sistema
   * OPERACIÓN CRÍTICA - Afecta múltiples colecciones
   * 
   * ADVERTENCIAS:
   * - Esta operación es IRREVERSIBLE
   * - Puede causar problemas en carritos, tickets y órdenes
   * - Considerar "soft delete" (marcar como inactivo) en su lugar
   * - Verificar dependencias antes de ejecutar
   * 
   * @param {string|ObjectId} id - ID del usuario a eliminar
   * @returns {Promise<Object|null>} Usuario eliminado o null
   * @throws {Error} Si hay errores de DB
   */
  async delete(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}

/**
 * EXPORTACIÓN DEL DAO DE USUARIOS
 * 
 * Se exporta la clase para instanciación en el Repository
 * Mantiene separación de responsabilidades en la arquitectura
 */
export default UsersDAO;
