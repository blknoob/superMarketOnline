/**
 * RUTAS DE AUTENTICACIÓN OAUTH SOCIAL
 * 
 * Router especializado para autenticación con providers externos
 * Incluye Google, Facebook y Apple OAuth
 * 
 * FUNCIONALIDADES:
 * - Login con Google OAuth 2.0
 * - Login con Facebook
 * - Login con Apple ID
 * - Callbacks de autenticación
 * - Redirecciones después del login
 * - Manejo de errores OAuth
 * 
 * SEGURIDAD:
 * - Scopes limitados (solo info básica)
 * - Validación de tokens por providers
 * - Creación automática de usuarios
 * - JWT tokens para sesiones
 * 
 * BASE PATH: /auth
 */
import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();
const { JWT_SECRET } = process.env;

// Si el proveedor OAuth no está configurado, volver al login en lugar de fallar
router.use("/:provider", (req, res, next) => {
  if (passport._strategy(req.params.provider)) return next();
  res.redirect(`/login?error=${req.params.provider}_not_configured`);
});

/**
 * GOOGLE OAUTH - INICIAR AUTENTICACIÓN
 * GET /auth/google
 * 
 * Redirige al usuario a Google para autenticación
 * Solicita acceso a email y perfil básico
 */
router.get("/google", 
  passport.authenticate("google", { 
    scope: ["profile", "email"] 
  })
);

/**
 * GOOGLE OAUTH - CALLBACK
 * GET /auth/google/callback
 * 
 * Google redirige aquí después de la autenticación
 * Procesa el resultado y crea/autentica usuario
 */
router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      if (req.user) {
        // Generar JWT token
        const token = jwt.sign(
          { 
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role 
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Establecer cookie segura
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        // Redirigir según el rol
        if (req.user.role === 'admin') {
          res.redirect("/admin/panel");
        } else {
          res.redirect("/?welcome=google");
        }
      } else {
        res.redirect("/login?error=google_auth_failed");
      }
    } catch (error) {
      console.error("Error en Google callback:", error);
      res.redirect("/login?error=server_error");
    }
  }
);

/**
 * FACEBOOK - INICIAR AUTENTICACIÓN
 * GET /auth/facebook
 */
router.get("/facebook",
  passport.authenticate("facebook", { 
    scope: ["email", "public_profile"] 
  })
);

/**
 * FACEBOOK - CALLBACK
 * GET /auth/facebook/callback
 */
router.get("/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  async (req, res) => {
    try {
      if (req.user) {
        const token = jwt.sign(
          { 
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role 
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        if (req.user.role === 'admin') {
          res.redirect("/admin/panel");
        } else {
          res.redirect("/?welcome=facebook");
        }
      } else {
        res.redirect("/login?error=facebook_auth_failed");
      }
    } catch (error) {
      console.error("Error en Facebook callback:", error);
      res.redirect("/login?error=server_error");
    }
  }
);

/**
 * APPLE - INICIAR AUTENTICACIÓN
 * GET /auth/apple
 */
router.get("/apple",
  passport.authenticate("apple", { 
    scope: ["name", "email"] 
  })
);

/**
 * APPLE - CALLBACK (POST porque Apple usa POST)
 * POST /auth/apple/callback
 */
router.post("/apple/callback",
  passport.authenticate("apple", { session: false }),
  async (req, res) => {
    try {
      if (req.user) {
        const token = jwt.sign(
          { 
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role 
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        if (req.user.role === 'admin') {
          res.redirect("/admin/panel");
        } else {
          res.redirect("/?welcome=apple");
        }
      } else {
        res.redirect("/login?error=apple_auth_failed");
      }
    } catch (error) {
      console.error("Error en Apple callback:", error);
      res.redirect("/login?error=server_error");
    }
  }
);

/**
 * LOGOUT GENERAL
 * GET /auth/logout
 * 
 * Cierra sesión independientemente del provider usado
 */
router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/?logout=success");
});

export default router;