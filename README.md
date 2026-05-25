# Trust Motors - Sitio Web

Sitio web minimalista para **Trust Motors**, automotora de confianza.

## Tecnologías

- HTML5 semántico
- CSS3 (variables, grid, flexbox, animaciones)
- JavaScript vanilla (sin dependencias)
- Google Fonts (Inter)

## Características

- Diseño minimalista con vehículos sobre fondo blanco con plataforma
- Filtros por marca, tipo, precio y año
- Tarjetas de vehículos con efecto showcase/estudio
- Modal de detalle de vehículo
- Formulario de contacto vía WhatsApp
- Botón flotante de WhatsApp
- Totalmente responsive (mobile-first)
- Navegación con scroll spy

## Uso

Abrir `index.html` en un navegador. No requiere servidor ni dependencias externas.

El enlace **Panel de administración** está en el pie de página (`panel.html`). Si tu hosting bloquea la carpeta `admin/`, usa siempre `panel.html`.

## Despliegue automático a cPanel (GitHub → hosting)

Para que cada cambio en `main` se publique solo en tu cPanel:

1. Lee la guía **[docs/DEPLOY-CPANEL.md](docs/DEPLOY-CPANEL.md)**
2. Configura los **secrets** de FTP en GitHub (`CPANEL_FTP_HOST`, `CPANEL_FTP_USERNAME`, etc.)
3. El workflow `.github/workflows/deploy-cpanel.yml` sube el sitio al hacer merge/push a `main`

### Panel admin protegido (login obligatorio)

El panel (`panel.html`) exige **email y contraseña** (`REQUIRE_AUTH = true` en `panel.js`).

1. Ejecuta **`sql/lock_admin_auth.sql`** en Supabase → SQL Editor (quita acceso anónimo al panel).
2. Crea tu usuario en **Authentication → Users → Add user** (marca **Auto Confirm User**).
3. Entra en **https://trustmotors.cl/panel.html** con ese email y contraseña.

El enlace al panel ya no aparece en el pie del sitio público.

### Acceso al panel (Supabase Auth)

El login usa **Supabase Authentication**, no la tabla `customers`:

1. En el dashboard de Supabase: **Authentication → Users → Add user**
2. Indica email y contraseña, y activa **Auto Confirm User** (o confirma el correo manualmente)
3. Si el login falla con «email not confirmed», desactiva **Confirm email** en **Authentication → Providers → Email**

Si creaste el usuario solo en **Table Editor** o en la tabla `customers`, no podrás iniciar sesión hasta crearlo en **Authentication**.
