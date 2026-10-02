# 🔐 Configuración OAuth Social Login

Este archivo contiene las instrucciones para configurar Google, Facebook y Apple OAuth en tu aplicación.

## 📋 Configuración requerida en .env

Actualiza tu archivo `.env` con las credenciales reales de cada proveedor:

```env
# GOOGLE OAUTH
GOOGLE_CLIENT_ID=tu_google_client_id_real
GOOGLE_CLIENT_SECRET=tu_google_client_secret_real
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# FACEBOOK OAUTH  
FACEBOOK_CLIENT_ID=tu_facebook_app_id_real
FACEBOOK_CLIENT_SECRET=tu_facebook_app_secret_real
FACEBOOK_CALLBACK_URL=http://localhost:8080/auth/facebook/callback

# APPLE OAUTH
APPLE_CLIENT_ID=tu_apple_service_id_real
APPLE_TEAM_ID=tu_apple_team_id_real
APPLE_KEY_ID=tu_apple_key_id_real
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_apple_private_key_real\n-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=http://localhost:8080/auth/apple/callback
```

## 🛠️ Configuración por Proveedor

### 📱 1. GOOGLE OAUTH

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita "Google+ API" 
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Configura:
   - **Orígenes autorizados**: `http://localhost:8080`
   - **URIs de redirección**: `http://localhost:8080/auth/google/callback`
6. Copia `Client ID` y `Client Secret` al .env

### 📘 2. FACEBOOK LOGIN

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva app o selecciona una existente
3. Agrega "Facebook Login" como producto
4. Configura:
   - **Valid OAuth Redirect URIs**: `http://localhost:8080/auth/facebook/callback`
   - **App Domains**: `localhost`
5. En "Configuración básica" copia:
   - **App ID** → `FACEBOOK_CLIENT_ID`
   - **App Secret** → `FACEBOOK_CLIENT_SECRET`

### 🍎 3. APPLE SIGN IN

1. Ve a [Apple Developer](https://developer.apple.com/account)
2. En "Certificates, Identifiers & Profiles":
   - Crea un **Service ID**
   - Crea una **Key** con "Sign in with Apple" habilitado
3. Configura:
   - **Return URLs**: `http://localhost:8080/auth/apple/callback`
   - **Domains**: `localhost`
4. Descarga la clave privada (.p8)
5. En .env usa:
   - Service ID → `APPLE_CLIENT_ID`
   - Team ID → `APPLE_TEAM_ID`
   - Key ID → `APPLE_KEY_ID`
   - Contenido del .p8 → `APPLE_PRIVATE_KEY`

## 🎯 URLs de Login

Una vez configurado, los usuarios podrán acceder a:

- **Google**: `http://localhost:8080/auth/google`
- **Facebook**: `http://localhost:8080/auth/facebook`  
- **Apple**: `http://localhost:8080/auth/apple`

## ⚠️ Notas importantes

1. **Para producción**: Actualiza todas las URLs de `localhost:8080` por tu dominio real
2. **HTTPS**: En producción, todos los providers requieren HTTPS
3. **Apple**: Solo funciona en HTTPS (excepto localhost para testing)
4. **Scopes**: Los scopes están configurados para acceso mínimo (email y perfil básico)

## 🔧 Para testing local

Puedes usar las configuraciones actuales en .env como placeholders, pero necesitarás las credenciales reales para que funcione.

## 🚀 Funcionalidades implementadas

✅ Login con Google OAuth 2.0  
✅ Login con Facebook  
✅ Login con Apple ID  
✅ Creación automática de usuarios  
✅ JWT tokens seguros  
✅ Redirección inteligente por rol  
✅ Interface de login unificada  
✅ Logout universal