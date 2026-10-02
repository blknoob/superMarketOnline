/**
 * TEMPLATES DE EMAIL Y MENSAJES - COMUNICACIÓN CON USUARIOS
 * 
 * Utilidades para generar templates de emails y mensajes del sistema
 * Proporciona plantillas HTML/texto para diferentes tipos de comunicación
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Templates HTML profesionales para emails
 * - Versiones texto plano para compatibilidad
 * - Mensajes de éxito y error estandarizados
 * - Personalización dinámica de contenido
 * 
 * TIPOS DE TEMPLATES:
 * - Recuperación de contraseña: Email con enlace temporal
 * - Mensajes de éxito: Confirmaciones de operaciones
 * - Mensajes de error: Notificaciones de fallos
 * - Templates responsivos y accesibles
 * 
 * CARACTERÍSTICAS DE DISEÑO:
 * - Responsive design para móviles
 * - Compatibilidad con clientes de email
 * - Estilos inline para mejor renderizado
 * - Branding consistente del sistema
 * 
 * CASOS DE USO:
 * - Sistema de recuperación de contraseñas
 * - Notificaciones de seguridad
 * - Confirmaciones de registro
 * - Comunicación automatizada con usuarios
 * 
 * INTEGRACIÓN DEL SISTEMA:
 * - MailingService: Envío de emails
 * - Controllers: Mensajes de respuesta
 * - Middleware: Notificaciones de error
 * - Auth system: Comunicación de seguridad
 */

/**
 * TEMPLATE HTML DE RECUPERACIÓN DE CONTRASEÑA
 * 
 * Genera email HTML profesional para proceso de recuperación
 * Incluye estilos responsivos y elementos de seguridad
 * 
 * @param {string} resetLink - URL del enlace de restablecimiento
 * @param {string} userName - Nombre del usuario (default: 'Usuario')
 * @returns {string} HTML completo del email
 * 
 * CARACTERÍSTICAS DEL TEMPLATE:
 * - Header con branding del sistema
 * - Botón prominente para acción principal
 * - Advertencias de seguridad visibles
 * - Alternativa de texto plano para enlace
 * - Footer con información legal
 * 
 * ELEMENTOS DE SEGURIDAD:
 * - Advertencia de expiración (1 hora)
 * - Instrucción sobre ignorar si no solicitó
 * - Nota sobre no reutilizar contraseña anterior
 * - Enlace alternativo para casos de renderizado
 * 
 * RESPONSIVE DESIGN:
 * - Máximo 600px de ancho
 * - Estilos inline para compatibilidad
 * - Typography optimizada para lectura
 * - Colores accesibles y contrastados
 * 
 * COMPATIBILIDAD:
 * - Outlook, Gmail, Apple Mail
 * - Clientes web y móviles
 * - Modo oscuro considerado
 * - Degradación elegante
 */
export const getEmailTemplate = (resetLink, userName = 'Usuario') => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #f4f4f4; padding: 30px; border-radius: 10px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recuperación de Contraseña</h1>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en nuestro ecommerce.</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Restablecer Contraseña</a>
                </div>
                <div class="warning">
                    <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
                </div>
                <p>Si no solicitaste este cambio de contraseña, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
                <p>Por tu seguridad, no podrás usar la misma contraseña que tenías anteriormente.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666;">
                    <strong>¿No puedes hacer clic en el botón?</strong><br>
                    Copia y pega este enlace en tu navegador:<br>
                    <span style="word-break: break-all; color: #007bff;">${resetLink}</span>
                </p>
            </div>
            <div class="footer">
                <p>Este email fue enviado automáticamente, por favor no respondas a este mensaje.</p>
                <p>&copy; 2025 Ecommerce - Sistema de Recuperación de Contraseñas</p>
            </div>
        </div>
    </body>
    </html>
`;

/**
 * CONFIGURACIÓN COMPLETA DE EMAIL DE RECUPERACIÓN
 * 
 * Genera objeto completo para envío de email con versiones HTML y texto
 * Incluye subject line optimizado y contenido dual-format
 * 
 * @param {string} resetLink - URL del enlace de restablecimiento
 * @param {string} expiresAt - Timestamp de expiración (no utilizado actualmente)
 * @returns {Object} Configuración completa de email
 * 
 * ESTRUCTURA DE RESPUESTA:
 * {
 *   subject: string,  // Línea de asunto del email
 *   html: string,     // Versión HTML del contenido
 *   text: string      // Versión texto plano
 * }
 * 
 * VENTAJAS DUAL-FORMAT:
 * - HTML: Experiencia rica y visual
 * - Texto: Compatibilidad universal
 * - Fallback: Clientes que bloquean HTML
 * - Accesibilidad: Lectores de pantalla
 * 
 * INTEGRACIÓN:
 * - MailingService utiliza objeto completo
 * - Nodemailer procesa ambos formatos
 * - Cliente decide qué versión mostrar
 */
export const getPasswordRecoveryEmailTemplate = (resetLink, expiresAt) => ({
  subject: "Recuperación de Contraseña",
  html: getEmailTemplate(resetLink, 'Usuario'),
  text: getPasswordRecoveryTextTemplate(resetLink, 'Usuario')
});

/**
 * TEMPLATE DE TEXTO PLANO PARA RECUPERACIÓN
 * 
 * Versión texto plano del email de recuperación
 * Compatible con todos los clientes de email
 * 
 * @param {string} resetLink - URL del enlace de restablecimiento
 * @param {string} userName - Nombre del usuario (default: 'Usuario')
 * @returns {string} Contenido en texto plano
 * 
 * CARACTERÍSTICAS:
 * - Formato limpio y legible
 * - Información esencial sin decoraciones
 * - Mismas advertencias de seguridad
 * - Separadores visuales ASCII
 * 
 * VENTAJAS:
 * - Compatible con clientes básicos
 * - Rápida carga y procesamiento
 * - Accesible para lectores de pantalla
 * - No bloqueado por filtros de spam
 * 
 * USO:
 * - Fallback automático si HTML falla
 * - Clientes que prefieren texto
 * - Entornos con ancho de banda limitado
 * - Sistemas legacy de email
 */
export const getPasswordRecoveryTextTemplate = (resetLink, userName = 'Usuario') => `
Hola ${userName},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetLink}

IMPORTANTE: Este enlace expirará en 1 hora por motivos de seguridad.

Si no solicitaste este cambio, puedes ignorar este email.

Por tu seguridad, no podrás usar la misma contraseña que tenías anteriormente.

---
Este email fue enviado automáticamente, por favor no respondas a este mensaje.
© 2025 Ecommerce - Sistema de Recuperación de Contraseñas
`;

/**
 * GENERADOR DE MENSAJES DE ÉXITO
 * 
 * Proporciona mensajes estandarizados para operaciones exitosas
 * Mantiene consistencia en comunicación con usuarios
 * 
 * @param {string} type - Tipo de operación exitosa
 * @returns {string} Mensaje de éxito apropiado
 * 
 * TIPOS SOPORTADOS:
 * - password_reset: Confirmación de cambio de contraseña
 * - login: Bienvenida tras inicio de sesión
 * - logout: Despedida tras cerrar sesión
 * - register: Confirmación de registro exitoso
 * - recovery_sent: Confirmación de envío de email
 * 
 * CARACTERÍSTICAS:
 * - Mensajes amigables y claros
 * - Tono profesional pero cálido
 * - Fallback para tipos no definidos
 * - Información sobre próximos pasos
 * 
 * CASOS DE USO:
 * - Respuestas de API exitosas
 * - Notificaciones en interfaz web
 * - Confirmaciones de operaciones
 * - Feedback positivo al usuario
 */
export const getSuccessMessage = (type) => {
  const messages = {
    password_reset: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    login: 'Inicio de sesión exitoso. Bienvenido de vuelta.',
    logout: 'Sesión cerrada correctamente. ¡Hasta pronto!',
    register: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
    recovery_sent: 'Hemos enviado un email con las instrucciones para restablecer tu contraseña.'
  };
  return messages[type] || 'Operación completada exitosamente.';
};

/**
 * GENERADOR DE MENSAJES DE ERROR
 * 
 * Proporciona mensajes de error estandarizados y user-friendly
 * Evita exposición de detalles técnicos sensibles
 * 
 * @param {string} type - Tipo de error ocurrido
 * @returns {string} Mensaje de error apropiado para mostrar al usuario
 * 
 * TIPOS DE ERROR CUBIERTOS:
 * - invalid_credentials: Credenciales incorrectas
 * - token_expired: Token de recuperación expirado
 * - token_invalid: Token de recuperación inválido
 * - same_password: Intento de usar misma contraseña
 * - email_not_found: Email no registrado en sistema
 * - unauthorized: Permisos insuficientes
 * - server_error: Error interno genérico
 * 
 * PRINCIPIOS DE SEGURIDAD:
 * - No revelar detalles internos del sistema
 * - Evitar información que ayude a atacantes
 * - Mensajes consistentes para casos similares
 * - Orientación para resolución cuando es posible
 * 
 * CARACTERÍSTICAS:
 * - Lenguaje claro y no técnico
 * - Tono profesional sin ser áspero
 * - Sugerencias de solución cuando es apropiado
 * - Fallback genérico para errores no mapeados
 * 
 * CASOS DE USO:
 * - Respuestas de error de API
 * - Notificaciones de fallo en interfaz
 * - Validaciones de formulario
 * - Manejo de excepciones user-facing
 */
export const getErrorMessage = (type) => {
  const messages = {
    invalid_credentials: 'Email o contraseña incorrectos.',
    token_expired: 'El enlace de recuperación ha expirado. Solicita uno nuevo.',
    token_invalid: 'El enlace de recuperación no es válido.',
    same_password: 'La nueva contraseña debe ser diferente a la actual.',
    email_not_found: 'No existe una cuenta asociada a este email.',
    unauthorized: 'No tienes permisos para realizar esta acción.',
    server_error: 'Error interno del servidor. Intenta más tarde.'
  };
  return messages[type] || 'Ha ocurrido un error inesperado.';
};