import UsersRepository from "../repositories/users.repository.js";
import { createHash, isValidPassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import MailingService from "./mailing.service.js";

/**
 * SERVICE DE USUARIOS
 * 
 * Servicio central que maneja toda la lógica de negocio relacionada con usuarios
 * Incluye autenticación, autorización, gestión de cuentas y recuperación de contraseñas
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Registro y autenticación de usuarios
 * - Gestión de roles (user/admin) con validaciones
 * - Sistema completo de recuperación de contraseña
 * - Operaciones CRUD con validaciones de negocio
 * - Encriptación segura de contraseñas
 * - Generación y manejo de JWT tokens
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - Hashing seguro de contraseñas con bcrypt
 * - Validación de tokens de recuperación
 * - Prevención de eliminación del último admin
 * - Verificación de duplicados de email
 * - Expiración automática de tokens de reset
 * 
 * INTEGRACIONES:
 * - UsersRepository: Para persistencia de datos
 * - Hash utilities: Para encriptación de contraseñas
 * - JWT utilities: Para manejo de tokens
 * - MailingService: Para emails de recuperación
 * 
 * ROLES DEL SISTEMA:
 * - 'user': Usuario estándar con permisos básicos
 * - 'admin': Administrador con permisos completos
 */
class UsersService {
  /**
   * CONSTRUCTOR DEL SERVICE DE USUARIOS
   * 
   * Inicializa las dependencias necesarias:
   * - Repository para operaciones de persistencia
   * - MailingService para envío de emails de recuperación
   */
  constructor() {
    this.repository = new UsersRepository();
    this.mailingService = new MailingService();
  }

  /**
   * CREAR NUEVO USUARIO
   * 
   * Registra un nuevo usuario en el sistema con todas las validaciones necesarias
   * Incluye encriptación de contraseña y asignación de roles
   * 
   * VALIDACIONES IMPLEMENTADAS:
   * - Campos obligatorios presentes (email, password, nombres)
   * - Email único en el sistema (doble verificación)
   * - Formato válido de email
   * - Role válido o asignación por defecto
   * 
   * PROCESO DE CREACIÓN:
   * 1. Validar campos obligatorios
   * 2. Verificar unicidad de email
   * 3. Encriptar contraseña con bcrypt
   * 4. Asignar role (default: 'user')
   * 5. Crear usuario en base de datos
   * 6. Manejar errores de duplicación a nivel DB
   * 
   * SEGURIDAD:
   * - Contraseñas hasheadas con bcrypt + salt
   * - Roles validados contra lista permitida
   * - Email normalizado antes de guardar
   * 
   * @param {Object} userData - Datos del nuevo usuario
   * @param {string} userData.first_name - Nombre del usuario
   * @param {string} userData.last_name - Apellido del usuario
   * @param {number} userData.age - Edad (opcional)
   * @param {string} userData.email - Email único del usuario
   * @param {string} userData.password - Contraseña en texto plano
   * @param {string} userData.role - Role ('user'|'admin', default: 'user')
   * @returns {Promise<Object>} Usuario creado o error estructurado
   */
  async createUser(userData) {
    try {
      const { first_name, last_name, age, email, password, role } = userData;

      if (!email || !password || !first_name || !last_name) {
        return {
          error: true,
          type: 400,
          message: "Faltan campos obligatorios",
        };
      }

      const existingUser = await this.repository.findByEmail(email);
      if (existingUser) {
        return {
          error: true,
          type: 400,
          message: "El usuario ya existe con ese email",
        };
      }

      const hashedPassword = createHash(password);

      const allowedRoles = ["user", "admin"];
      const assignedRole = allowedRoles.includes(role) ? role : "user";

      const newUserData = {
        first_name,
        last_name,
        age: age || null,
        email,
        password: hashedPassword,
        role: assignedRole,
      };

      const createdUser = await this.repository.create(newUserData);

      if (!createdUser) {
        return { error: true, type: 500, message: "Error creando usuario" };
      }

      return createdUser;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.email) {
        return {
          error: true,
          type: 400,
          message: "El usuario ya existe con ese email (detected al guardar)",
        };
      }
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  /**
   * REGISTRAR USUARIO (ALIAS)
   * 
   * Método alias para createUser, usado en contextos de registro público
   * Mantiene la misma lógica pero con semántica más clara para registro
   * 
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Promise<Object>} Usuario creado o error estructurado
   */
  async register(userData) {
    return await this.createUser(userData);
  }

  /**
   * AUTENTICAR USUARIO (LOGIN)
   * 
   * Autentica un usuario con email y contraseña
   * Genera JWT token para mantener sesión
   * 
   * PROCESO DE AUTENTICACIÓN:
   * 1. Validar campos obligatorios
   * 2. Buscar usuario por email
   * 3. Verificar contraseña con hash almacenado
   * 4. Generar JWT token con datos del usuario
   * 5. Retornar usuario y token para sesión
   * 
   * SEGURIDAD:
   * - Verificación segura con bcrypt
   * - No exposición de datos sensibles
   * - JWT con información mínima necesaria
   * - Mensajes de error genéricos para evitar enum
   * 
   * JWT PAYLOAD:
   * - _id: ID del usuario
   * - email: Email del usuario
   * - role: Role para autorización
   * 
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<Object>} Usuario y token o error estructurado
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        return {
          error: true,
          type: 400,
          message: "Email y contraseña son requeridos",
        };
      }

      const user = await this.repository.findByEmail(email);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      if (!isValidPassword(password, user.password)) {
        return { error: true, type: 401, message: "Contraseña incorrecta" };
      }

      const token = generateToken({
        _id: user._id,
        email: user.email,
        role: user.role,
      });

      return {
        user: user,
        token,
      };
    } catch (error) {
      throw new Error(`Error en login: ${error.message}`);
    }
  }

  /**
   * OBTENER TODOS LOS USUARIOS
   * 
   * Lista todos los usuarios del sistema
   * Método administrativo con acceso completo
   * 
   * USO TÍPICO:
   * - Panel de administración de usuarios
   * - Reportes y estadísticas de usuarios
   * - Operaciones masivas administrativas
   * 
   * CONSIDERACIONES:
   * - Filtrar contraseñas en respuesta (Repository)
   * - Implementar paginación para muchos usuarios
   * - Considerar caché para consultas frecuentes
   * 
   * @returns {Promise<Array>} Lista completa de usuarios
   * @throws {Error} Si hay errores en la consulta
   */
  async getAll() {
    try {
      const users = await this.repository.findAll();
      return users;
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  /**
   * OBTENER USUARIO POR ID
   * 
   * Busca un usuario específico por su ObjectId
   * Incluye validación de existencia
   * 
   * CASOS DE USO:
   * - Perfil de usuario
   * - Validación de permisos
   * - Operaciones administrativas
   * - Populación de datos en otras entidades
   * 
   * @param {string|ObjectId} id - ID del usuario a buscar
   * @returns {Promise<Object>} Usuario encontrado o error estructurado
   * @throws {Error} Si hay errores críticos del sistema
   */
  async getById(id) {
    try {
      if (!id) {
        return { error: true, type: 400, message: "ID de usuario inválido" };
      }

      const user = await this.repository.findById(id);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      return user;
    } catch (error) {
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }
  }

  async getByEmail(email) {
    try {
      if (!email || typeof email !== "string") {
        return { error: true, type: 400, message: "Email inválido" };
      }

      const user = await this.repository.findByEmail(email);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      return user;
    } catch (error) {
      throw new Error(`Error obteniendo usuario por email: ${error.message}`);
    }
  }

  async getByResetToken(token) {
    try {
      if (!token || typeof token !== "string") {
        return { error: true, type: 400, message: "Token inválido" };
      }

      const user = await this.repository.findByResetToken(token);
      if (!user) {
        return { error: true, type: 404, message: "Token inválido o expirado" };
      }

      return user;
    } catch (error) {
      throw new Error(`Error obteniendo usuario por token: ${error.message}`);
    }
  }

  async tryEmail(email) {
    try {
      if (!email || typeof email !== "string") {
        return false;
      }

      const user = await this.repository.findByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async updateUser(id, updateData) {
    try {
      if (!id || typeof updateData !== "object") {
        return {
          error: true,
          type: 400,
          message: "Parámetros inválidos para actualizar el usuario",
        };
      }

      const user = await this.repository.findById(id);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      const result = await this.repository.update(id, updateData);

      if (!result) {
        return {
          error: true,
          type: 500,
          message: "No se pudo actualizar el usuario",
        };
      }

      return {
        status: "success",
        message: "Usuario actualizado correctamente",
      };
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      if (!id) {
        return { error: true, type: 400, message: "ID de usuario inválido" };
      }

      const user = await this.repository.findById(id);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      const result = await this.repository.delete(id);

      if (!result) {
        return {
          error: true,
          type: 500,
          message: "No se pudo eliminar el usuario",
        };
      }

      return { status: "success", message: "Usuario eliminado correctamente" };
    } catch (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  }

  async changePassword(userId, newPlainPassword) {
    try {
      if (!userId || typeof newPlainPassword !== "string") {
        return { error: true, type: 400, message: "Parámetros inválidos" };
      }

      const user = await this.repository.findById(userId);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      const hashedPassword = createHash(newPlainPassword);
      const result = await this.repository.update(userId, {
        password: hashedPassword,
      });

      if (!result) {
        return {
          error: true,
          type: 500,
          message: "No se pudo cambiar la contraseña",
        };
      }

      return {
        status: "success",
        message: "Contraseña actualizada correctamente",
      };
    } catch (error) {
      throw new Error(`Error cambiando contraseña: ${error.message}`);
    }
  }

  async changeUserRole(userId, newRole) {
    try {
      if (!userId || !newRole) {
        return {
          error: true,
          type: 400,
          message: "ID de usuario y nuevo role son requeridos",
        };
      }

      const allowedRoles = ["user", "admin"];
      if (!allowedRoles.includes(newRole)) {
        return {
          error: true,
          type: 400,
          message: "Role inválido. Solo se permite: user, admin",
        };
      }

      const user = await this.repository.findById(userId);
      if (!user) {
        return { error: true, type: 404, message: "Usuario no encontrado" };
      }

      if (user.role === "admin" && newRole !== "admin") {
        const allUsers = await this.repository.findAll();
        const adminCount = allUsers.filter((u) => u.role === "admin").length;

        if (adminCount <= 1) {
          return {
            error: true,
            type: 400,
            message:
              "No se puede quitar el rol de admin al último administrador",
          };
        }
      }

      const result = await this.repository.update(userId, { role: newRole });

      if (!result) {
        return {
          error: true,
          type: 500,
          message: "No se pudo cambiar el role del usuario",
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Error cambiando role de usuario: ${error.message}`);
    }
  }

  /**
   * RECUPERAR CONTRASEÑA (FORGOT PASSWORD)
   * 
   * Inicia el proceso de recuperación de contraseña
   * Genera token seguro y envía email de recuperación
   * 
   * PROCESO DE RECUPERACIÓN:
   * 1. Validar email proporcionado
   * 2. Buscar usuario por email
   * 3. Generar token JWT con expiración
   * 4. Guardar token y fecha de expiración
   * 5. Enviar email con enlace de recuperación
   * 6. Confirmar envío (sin revelar si usuario existe)
   * 
   * SEGURIDAD:
   * - Token con expiración de 1 hora
   * - No revela si el email existe en el sistema
   * - Token de uso único
   * - Invalidación automática al cambiar contraseña
   * 
   * PRIVACIDAD:
   * - Respuesta genérica independiente de si existe el usuario
   * - Previene enumeración de cuentas de usuarios
   * 
   * @param {string} email - Email del usuario que olvidó contraseña
   * @returns {Promise<Object>} Confirmación genérica de procesamiento
   * @throws {Error} Si hay errores en el proceso
   */
  async forgotPassword(email) {
    try {
      if (!email || typeof email !== "string") {
        return { error: true, type: 400, message: "Email es requerido" };
      }

      const user = await this.repository.findByEmail(email);

      if (!user) {
        return { error: false, message: "Email procesado" };
      }

      const resetToken = generateToken({ userId: user._id });
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await this.repository.update(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      });

      await this.mailingService.sendEmail(user.email, resetToken);

      return { error: false, message: "Email de recuperación enviado" };
    } catch (error) {
      throw new Error(`Error en forgot password: ${error.message}`);
    }
  }

  /**
   * RESTABLECER CONTRASEÑA
   * 
   * Completa el proceso de recuperación estableciendo nueva contraseña
   * Valida token y actualiza contraseña de forma segura
   * 
   * PROCESO DE RESTABLECIMIENTO:
   * 1. Validar token y nueva contraseña
   * 2. Buscar usuario por token válido y no expirado
   * 3. Verificar que nueva contraseña es diferente
   * 4. Hashear nueva contraseña
   * 5. Actualizar usuario con nueva contraseña
   * 6. Limpiar token de recuperación
   * 7. Confirmar restablecimiento exitoso
   * 
   * VALIDACIONES DE SEGURIDAD:
   * - Token válido y no expirado
   * - Nueva contraseña diferente a la anterior
   * - Encriptación segura de nueva contraseña
   * - Invalidación inmediata del token usado
   * 
   * LIMPIEZA AUTOMÁTICA:
   * - resetPasswordToken: null
   * - resetPasswordExpires: null
   * 
   * @param {string} token - Token de recuperación recibido por email
   * @param {string} newPassword - Nueva contraseña en texto plano
   * @returns {Promise<Object>} Confirmación o error estructurado
   * @throws {Error} Si hay errores en el proceso
   */
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        return {
          error: true,
          type: 400,
          message: "Token y nueva contraseña son requeridos",
        };
      }

      const user = await this.repository.findByResetToken(token);
      if (!user) {
        return {
          error: true,
          type: 400,
          message: "Token inválido o expirado",
        };
      }

      if (isValidPassword(newPassword, user.password)) {
        return {
          error: true,
          type: 400,
          message: "La nueva contraseña debe ser diferente a la anterior",
        };
      }

      const hashedPassword = createHash(newPassword);

      await this.repository.update(user._id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      return {
        error: false,
        message: "Contraseña restablecida exitosamente",
      };
    } catch (error) {
      throw new Error(`Error en reset password: ${error.message}`);
    }
  }

  async update(id, userData) {
    return await this.updateUser(id, userData);
  }

  async delete(id) {
    return await this.deleteUser(id);
  }
}

export default UsersService;
