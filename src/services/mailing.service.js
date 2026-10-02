import nodemailer from "nodemailer";
import { getEmailTemplate } from "../utils/templates.js";

/**
 * SERVICE DE MAILING - ENVÍO DE EMAILS
 * 
 * Servicio especializado en el envío de correos electrónicos del sistema
 * Utiliza Nodemailer con configuración SMTP para Gmail
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Envío de emails de recuperación de contraseña
 * - Templates HTML personalizados para emails
 * - Configuración segura SMTP con autenticación
 * - Manejo de errores en envío de correos
 * - Soporte para TLS y conexiones seguras
 * 
 * CONFIGURACIÓN SMTP:
 * - Provider: Gmail SMTP (smtp.gmail.com)
 * - Puerto: 587 (TLS/STARTTLS)
 * - Autenticación: OAuth2 o App Password
 * - Seguridad: TLS habilitado
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - EMAIL_USER: Cuenta de Gmail para envío
 * - EMAIL_PASS: App Password de Gmail
 * - FRONTEND_URL: URL base del frontend para enlaces
 * 
 * CASOS DE USO:
 * - Recuperación de contraseñas olvidadas
 * - Confirmación de registro de usuarios
 * - Notificaciones de compras realizadas
 * - Alertas administrativas del sistema
 * 
 * CONSIDERACIONES DE SEGURIDAD:
 * - Usar App Passwords en lugar de contraseña real
 * - Configurar OAuth2 para mayor seguridad
 * - Validar destinatarios antes de envío
 * - Rate limiting para prevenir spam
 */
class MailingService {  /**
   * CONSTRUCTOR DEL SERVICE DE MAILING
   * 
   * Inicializa el transporter de Nodemailer con configuración SMTP para Gmail
   * 
   * CONFIGURACIÓN SMTP ESTABLECIDA:
   * - Host: smtp.gmail.com (servidor SMTP de Google)
   * - Puerto: 587 (STARTTLS - conexión segura)
   * - Seguridad: TLS habilitado, permite certificados auto-firmados
   * - Autenticación: Usuario y contraseña desde variables de entorno
   * 
   * VARIABLES DE ENTORNO UTILIZADAS:
   * - EMAIL_USER: Cuenta de Gmail remitente
   * - EMAIL_PASS: App Password (no la contraseña real de Gmail)
   * 
   * CONFIGURACIÓN DE SEGURIDAD:
   * - rejectUnauthorized: false (permite certificados locales)
   * - secure: false (usa STARTTLS en lugar de SSL directo)
   */  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * ENVIAR EMAIL DE RECUPERACIÓN DE CONTRASEÑA
   * 
   * Envía un correo electrónico con enlace para restablecer contraseña
   * Utiliza template HTML personalizado con enlace seguro
   * 
   * PROCESO DE ENVÍO:
   * 1. Construir URL de recuperación con token incluido
   * 2. Generar template HTML personalizado
   * 3. Configurar opciones del email (remitente, destinatario, asunto)
   * 4. Enviar email a través del transporter SMTP
   * 5. Retornar resultado del envío (éxito o error)
   * 
   * CONSTRUCCIÓN DE URL:
   * - Base URL desde FRONTEND_URL o localhost:8080 por defecto
   * - Ruta: /reset-password
   * - Parámetro: token con valor del resetToken
   * - Ejemplo: "http://localhost:8080/reset-password?token=abc123"
   * 
   * TEMPLATE DEL EMAIL:
   * - HTML personalizado generado por getEmailTemplate()
   * - Incluye nombre del usuario extraído del email
   * - Botón/enlace directo para reset de contraseña
   * - Diseño responsive y profesional
   * 
   * CONFIGURACIÓN DEL EMAIL:
   * - From: Cuenta configurada en EMAIL_USER
   * - To: Email del usuario que solicitó reset
   * - Subject: "Recuperación de Contraseña"
   * - Content-Type: HTML con template personalizado
   * 
   * MANEJO DE ERRORES:
   * - Captura errores del transporter SMTP
   * - Log de errores para debugging
   * - Respuesta estructurada con success/error flag
   * 
   * @param {string} email - Email destinatario para recuperación
   * @param {string} resetToken - Token JWT para validación de reset
   * @returns {Promise<Object>} Resultado del envío
   * @returns {Promise<Object>} result.success - true si se envió correctamente
   * @returns {Promise<Object>} result.messageId - ID del mensaje enviado
   * @returns {Promise<Object>} result.error - true si hubo error
   * @returns {Promise<Object>} result.message - Mensaje descriptivo del error
   */
  async sendEmail(email, resetToken) {
    try {
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:8080"
      }/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Recuperación de Contraseña",
        html: getEmailTemplate(resetUrl, email.split("@")[0]),
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Error enviando email:", error.message);
      return { error: true, message: "Error enviando email de recuperación" };
    }
  }
}

export default MailingService;
