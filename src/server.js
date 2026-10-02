/**
 * @fileoverview Servidor principal de SuperMercado Online
 * 
 * Punto de entrada de la aplicación que configura Express.js con todas las
 * características de seguridad, middlewares y rutas necesarias. Implementa
 * estándares OWASP para máxima seguridad en producción.
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - Configuración de seguridad OWASP completa
 * - Rate limiting por tipo de operación
 * - Headers de seguridad con Helmet
 * - CORS configurado para producción
 * - Sesiones seguras con cookies HttpOnly
 * - Autenticación JWT integrada
 * - Logging estructurado de todas las requests
 * - Manejo centralizado de errores
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - A01:2021 Broken Access Control: Rate limiting y autenticación
 * - A02:2021 Cryptographic Failures: Sesiones y cookies seguras
 * - A03:2021 Injection: Sanitización y detección de ataques
 * - A05:2021 Security Misconfiguration: Headers y CORS seguros
 * - A06:2021 Vulnerable Components: Helmet y middlewares actualizados
 * - A09:2021 Security Logging: Logging completo de eventos
 * 
 * ARQUITECTURA:
 * - Express.js como framework base
 * - Handlebars para renderizado de vistas
 * - Passport.js para autenticación
 * - Winston para logging estructurado
 * - Mongoose para conexión MongoDB
 * 
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import validateEnvVars from "./configs/env.js";
import { connectDB } from "./configs/db.js";
import { configureHandlebars } from "./configs/handlebars.js";
import { initializePassport } from "./configs/passport/index.js";
import { logRequest } from "./utils/logger.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import {
  rateLimit,
  sanitizeInput,
  detectAttacks,
  securityLogger,
} from "./middlewares/security.middleware.js";
import jwt from "jsonwebtoken";

import indexRouter from "./routes/index.router.js";
import UsersService from "./services/users.service.js";

dotenv.config();

// OWASP - Validar variables de entorno al inicio
const env = validateEnvVars();

const app = express();
const PORT = env.PORT || 8080;

// OWASP - Configuración de helmet para headers de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// OWASP - Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// OWASP - Configuración segura de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Cambiar nombre por defecto
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 horas en lugar de 24
      sameSite: "strict", // Protección CSRF
    },
  })
);

configureHandlebars(app);

app.use(passport.initialize());
app.use(passport.session());
initializePassport();

/**
 * Middleware global de decodificación JWT
 * 
 * Extrae y decodifica automáticamente el token JWT desde cookies
 * para todas las rutas. Hace disponible la información del usuario
 * en req.user sin bloquear el acceso si no hay token válido.
 * 
 * FUNCIONALIDAD:
 * - Extracción de token desde cookie 'access_token'
 * - Decodificación automática con JWT_SECRET
 * - Inyección en req.user (null si no hay token válido)
 * - No bloquea acceso para rutas públicas
 * 
 * CASOS DE USO:
 * - Rutas que pueden funcionar con o sin autenticación
 * - Personalización de vistas según usuario
 * - Verificación opcional de estado de login
 * - Base para middlewares de autorización específicos
 */
app.use((req, res, next) => {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

app.use(express.static("public"));

/**
 * Handler para favicon.ico
 * 
 * Responde con status 204 (No Content) para evitar errores 404
 * en navegadores que solicitan automáticamente el favicon.
 * Mejora la experiencia del usuario y reduce logs innecesarios.
 * 
 * BENEFICIOS:
 * - Previene errores 404 en logs
 * - Mejora métricas de error
 * - Respuesta rápida sin procesamiento
 * - Estándar web para manejo de favicon
 */
app.get("/favicon.ico", (req, res) => {
  res.status(204).send();
});

// Middlewares de seguridad OWASP (orden importante)
app.use(detectAttacks);
app.use(sanitizeInput);
app.use(securityLogger);

// OWASP - Rate limiting más estricto
app.use("/api/users/login", rateLimit("auth"));
app.use("/api/users/register", rateLimit("registration"));
app.use("/api/users/reset-password", rateLimit("resetPassword"));
app.use("/api/users/forgot-password", rateLimit("resetPassword"));
app.use("/api/", rateLimit("api"));

// Middleware de logging para todas las requests
app.use(logRequest);

app.use("/", indexRouter);

// Middleware para rutas no encontradas
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

/**
 * Función principal de inicialización del servidor
 * 
 * Ejecuta la secuencia completa de inicio de la aplicación:
 * 1. Establece conexión con MongoDB
 * 2. Inicia servidor Express en el puerto configurado
 * 3. Maneja errores de inicialización con terminación controlada
 * 
 * PROCESO DE INICIALIZACIÓN:
 * - Validación de variables de entorno (ya ejecutada)
 * - Conexión a base de datos MongoDB
 * - Inicio del servidor HTTP en puerto configurado
 * - Logging de estado de inicialización
 * - Manejo de fallos con process.exit(1)
 * 
 * CASOS DE ERROR:
 * - Fallo de conexión a MongoDB: termina proceso
 * - Puerto ocupado: termina proceso
 * - Error de configuración: termina proceso
 * - Cualquier excepción no controlada: termina proceso
 * 
 * @async
 * @function startServer
 * @returns {Promise<void>} Promise que se resuelve cuando el servidor inicia
 * @throws {Error} Termina proceso con exit(1) si hay errores críticos
 */
const startServer = async () => {
  try {
    await connectDB();
    const admin = await new UsersService().ensureAdminUser();
    if (admin) console.log(`Administrador inicial creado: ${admin.email}`);
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

startServer();
