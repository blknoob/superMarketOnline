/**
 * @fileoverview Configuración de Passport.js para autenticación JWT
 *
 * Sistema de autenticación basado en JSON Web Tokens utilizando cookies.
 * Implementa estrategia JWT con extracción desde cookies para mayor seguridad
 * en aplicaciones web, evitando almacenamiento en localStorage.
 *
 * CARACTERÍSTICAS:
 * - Autenticación JWT desde cookies
 * - Serialización/deserialización de usuarios
 * - Integración con repositorio de usuarios
 * - Manejo robusto de errores
 * - Extractor personalizado para cookies
 *
 * SEGURIDAD:
 * - Tokens en cookies HttpOnly
 * - Validación de integridad JWT
 * - Verificación de existencia de usuario
 * - Manejo seguro de errores sin exposición
 *
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";
import AppleStrategy from "passport-apple";
import UsersRepository from "../../repositories/users.repository.js";

const { JWT_SECRET } = process.env;

/**
 * Extrae token JWT desde cookies de la request
 *
 * Función extractora personalizada que busca el token de acceso
 * en las cookies de la petición HTTP, específicamente en 'access_token'.
 *
 * SEGURIDAD:
 * - Validación de existencia de request y cookies
 * - Retorno null si no encuentra token
 * - No exposición de errores internos
 *
 * @function cookieExtractor
 * @param {Object} req - Objeto request de Express
 * @returns {string|null} Token JWT o null si no existe
 */
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["access_token"];
  }
  return token;
};

/**
 * Inicializa y configura Passport.js con estrategia JWT
 *
 * Configura la estrategia de autenticación JWT, serialización y
 * deserialización de usuarios para sesiones persistentes.
 *
 * CONFIGURACIÓN ESTRATEGIA JWT:
 * - Secret desde variable de entorno
 * - Extracción desde cookies
 * - Verificación de usuario en base de datos
 * - Manejo de errores de autenticación
 *
 * SERIALIZACIÓN:
 * - serializeUser: Guarda ID de usuario en sesión
 * - deserializeUser: Recupera usuario completo por ID
 *
 * CASOS DE USO:
 * - Login con JWT
 * - Middleware de autenticación en rutas protegidas
 * - Persistencia de sesión entre requests
 * - Validación automática de tokens
 *
 * @function initializePassport
 * @returns {void}
 */

const initializePassport = () => {
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        secretOrKey: JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      },
      async (payload, done) => {
        try {
          const usersRepository = new UsersRepository();
          const user = await usersRepository.findById(payload._id);
          if (!user) return done(null, false);
          return done(null, user, payload);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const usersRepository = new UsersRepository();
      const user = await usersRepository.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Las estrategias OAuth solo se registran si su proveedor está configurado
  // ESTRATEGIA GOOGLE OAUTH 2.0
  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy.Strategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const usersRepository = new UsersRepository();
        
        // Buscar usuario existente por Google ID o email
        let user = await usersRepository.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });

        if (user) {
          // Usuario existe, actualizar Google ID si no lo tiene
          if (!user.googleId) {
            user.googleId = profile.id;
            await usersRepository.update(user._id, { googleId: profile.id });
          }
          return done(null, user);
        }

        // Crear nuevo usuario desde Google
        const newUser = {
          googleId: profile.id,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          email: profile.emails[0].value,
          age: null,
          password: null, // No necesita password
          role: 'user',
          provider: 'google',
          avatar: profile.photos[0]?.value,
          isVerified: true // Google ya verificó el email
        };

        const createdUser = await usersRepository.create(newUser);
        done(null, createdUser);
      } catch (error) {
        console.error('Error en Google OAuth:', error);
        done(error, null);
      }
    }));
  }

  // ESTRATEGIA FACEBOOK
  if (process.env.FACEBOOK_CLIENT_ID) {
    passport.use(new FacebookStrategy.Strategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name', 'picture']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const usersRepository = new UsersRepository();
        
        // Buscar usuario existente por Facebook ID o email
        let user = await usersRepository.findOne({ 
          $or: [
            { facebookId: profile.id },
            { email: profile.emails?.[0]?.value }
          ]
        });

        if (user) {
          // Usuario existe, actualizar Facebook ID si no lo tiene
          if (!user.facebookId) {
            user.facebookId = profile.id;
            await usersRepository.update(user._id, { facebookId: profile.id });
          }
          return done(null, user);
        }

        // Crear nuevo usuario desde Facebook
        const newUser = {
          facebookId: profile.id,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          email: profile.emails?.[0]?.value || `${profile.id}@facebook.temp`,
          age: null,
          password: null,
          role: 'user',
          provider: 'facebook',
          avatar: profile.photos?.[0]?.value,
          isVerified: true
        };

        const createdUser = await usersRepository.create(newUser);
        done(null, createdUser);
      } catch (error) {
        console.error('Error en Facebook OAuth:', error);
        done(error, null);
      }
    }));
  }

  // ESTRATEGIA APPLE
  if (process.env.APPLE_CLIENT_ID) {
    passport.use(new AppleStrategy.Strategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      key: process.env.APPLE_PRIVATE_KEY,
      callbackURL: process.env.APPLE_CALLBACK_URL || "/auth/apple/callback",
      scope: 'name email'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const usersRepository = new UsersRepository();
        
        // Apple maneja la privacidad diferente
        const appleId = profile.id;
        const email = profile.email;
        
        let user = await usersRepository.findOne({ 
          $or: [
            { appleId: appleId },
            { email: email }
          ]
        });

        if (user) {
          if (!user.appleId) {
            user.appleId = appleId;
            await usersRepository.update(user._id, { appleId: appleId });
          }
          return done(null, user);
        }

        // Crear nuevo usuario desde Apple
        const newUser = {
          appleId: appleId,
          first_name: profile.name?.givenName || 'Usuario',
          last_name: profile.name?.familyName || 'Apple',
          email: email || `${appleId}@privaterelay.appleid.com`,
          age: null,
          password: null,
          role: 'user',
          provider: 'apple',
          isVerified: true
        };

        const createdUser = await usersRepository.create(newUser);
        done(null, createdUser);
      } catch (error) {
        console.error('Error en Apple OAuth:', error);
        done(error, null);
      }
    }));
  }
};

export { initializePassport };
