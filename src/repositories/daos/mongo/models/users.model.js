/**
 * MODELO DE USUARIOS - SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN
 * 
 * Este modelo maneja toda la información de usuarios del supermercado online.
 * Incluye datos personales, credenciales, roles y funcionalidad de recuperación de contraseña.
 * 
 * Funcionalidades que soporta:
 * - Registro e inicio de sesión de usuarios
 * - Sistema de roles (user/admin)
 * - Recuperación de contraseña con tokens seguros
 * - Perfil de usuario con datos personales
 * 
 * Relaciones:
 * - Tiene UN carrito activo (carts.user)
 * - Puede tener MÚLTIPLES tickets de compra (orders.user)
 * - Puede tener MÚLTIPLES órdenes (orders.user)
 * 
 * Seguridad implementada:
 * - Email único para prevenir duplicados
 * - Contraseñas hasheadas (nunca en texto plano)
 * - Tokens de recuperación con expiración
 */

import mongoose from "mongoose";

/**
 * DIRECCIÓN DE ENVÍO
 * Un usuario puede guardar varias; una se marca como predeterminada.
 * La orden copia la dirección elegida, así que editarla después no
 * cambia órdenes anteriores.
 */
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Casa", trim: true },
    recipient: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    reference: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: false }
);

/**
 * ESQUEMA DE USUARIOS
 * Define todos los campos necesarios para manejar usuarios del sistema
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * NOMBRE DEL USUARIO
     * Primer nombre o nombres del usuario
     * - Se usa en saludos y personalización
     * - Requerido para completar el perfil
     */
    first_name: {
      type: String,
      required: true,
    },

    /**
     * APELLIDO DEL USUARIO
     * Apellido(s) del usuario
     * - Junto con first_name forma el nombre completo
     * - Se usa en órdenes
     */
    last_name: {
      type: String,
      required: true,
    },

    /**
     * EMAIL - IDENTIFICADOR ÚNICO
     * Dirección de correo electrónico del usuario
     * - Usado como username para login
     * - Único en el sistema (unique: true)
     * - Se usa para comunicaciones y recuperación de contraseña
     * - Debe ser validado antes de guardar
     */
    email: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * FECHA DE NACIMIENTO
     * Fecha de nacimiento del usuario
     * - Requerido para cumplir con regulaciones (mayoría de edad)
     * - Se puede usar para restricciones de productos (alcohol, etc.)
     * - El usuario debe ser mayor de 18 años para registrarse
     */
    birth_date: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          if (!date) return false;
          const today = new Date();
          const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
          return date <= eighteenYearsAgo;
        },
        message: 'Debes ser mayor de 18 años para registrarte'
      }
    },

    /**
     * CONTRASEÑA HASHEADA
     * Hash de la contraseña del usuario (NUNCA texto plano)
     * - Procesada con bcrypt antes de almacenar
     * - Validada con patrones seguros en registro
     * - Debe incluir mayúscula, minúscula, número y símbolo
     * - No requerido para usuarios OAuth
     */
    password: {
      type: String,
      required: false, // Cambiado para permitir OAuth sin password
    },

    /**
     * ROL DEL USUARIO EN EL SISTEMA
     * Define los permisos y capacidades del usuario
     * - "user": Cliente normal (compras, carrito, perfil)
     * - "admin": Administrador (gestionar productos, usuarios, pedidos)
     * - Por defecto: "user"
     * - Se usa en middleware de autorización
     */
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /**
     * PROVEEDOR DE AUTENTICACIÓN
     * Indica cómo se registró el usuario
     * - "local": Registro tradicional con email/password
     * - "google": Login con Google OAuth
     * - "facebook": Login con Facebook
     * - "apple": Login con Apple ID
     */
    provider: {
      type: String,
      enum: ["local", "google", "facebook", "apple"],
      default: "local",
    },

    /**
     * ID DE GOOGLE OAUTH
     * Identificador único de Google para este usuario
     * - Se obtiene durante el proceso OAuth
     * - Permite login automático sin password
     */
    googleId: {
      type: String,
      default: null,
    },

    /**
     * ID DE FACEBOOK
     * Identificador único de Facebook para este usuario
     */
    facebookId: {
      type: String,
      default: null,
    },

    /**
     * ID DE APPLE
     * Identificador único de Apple ID para este usuario
     */
    appleId: {
      type: String,
      default: null,
    },

    /**
     * AVATAR DEL USUARIO
     * URL de la foto de perfil del usuario
     * - Puede venir de OAuth providers
     * - URL completa o path relativo
     */
    avatar: {
      type: String,
      default: null,
    },

    /**
     * VERIFICACIÓN DE EMAIL
     * Indica si el email ha sido verificado
     * - true para usuarios OAuth (pre-verificados)
     * - false para registro local hasta verificar
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * DIRECCIONES DE ENVÍO
     */
    addresses: {
      type: [addressSchema],
      default: [],
    },

    /**
     * TOKEN DE RECUPERACIÓN DE CONTRASEÑA
     * Token aleatorio y seguro para resetear contraseña
     * - Generado cuando el usuario solicita recuperación
     * - null cuando no hay proceso de recuperación activo
     * - Se envía por email al usuario
     * - Debe ser verificado junto con resetPasswordExpires
     */
    resetPasswordToken: {
      type: String,
      default: null,
    },

    /**
     * FECHA DE EXPIRACIÓN DEL TOKEN DE RECUPERACIÓN
     * Timestamp que indica cuándo expira el token de recuperación
     * - Previene uso de tokens antiguos (seguridad)
     * - Típicamente 1-2 horas después de generación
     * - null cuando no hay proceso de recuperación activo
     * - Verificado antes de permitir cambio de contraseña
     */
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    /**
     * CONFIGURACIONES DEL ESQUEMA
     */
    
    /**
     * timestamps: true
     * Campos automáticos de auditoria:
     * - createdAt: Fecha de registro del usuario
     * - updatedAt: Última modificación del perfil
     */
    timestamps: true,
    
    /**
     * versionKey: false
     * Elimina el campo __v de Mongoose
     * Simplifica la estructura del documento de usuario
     */
    versionKey: false,
  }
);

/**
 * MODELO MONGOOSE PARA USUARIOS
 * 
 * Interface principal para manejo de usuarios en el sistema
 * - Nombre de colección: "users"
 * - Índices automáticos: _id, email (unique)
 * 
 * Métodos típicos de uso:
 * - User.findOne({ email }): Login y verificaciones
 * - User.create(userData): Registro de nuevos usuarios
 * - User.findById(userId): Obtener perfil de usuario
 * - User.updateOne({ _id }, { resetPasswordToken, resetPasswordExpires }): Recuperación
 * - User.find({ role: 'admin' }): Listar administradores
 * 
 * Consideraciones de seguridad:
 * - Nunca devolver el campo password en respuestas
 * - Validar email antes de operaciones críticas
 * - Limpiar tokens de recuperación después de uso
 */
const User = mongoose.model("User", userSchema);

export default User;
