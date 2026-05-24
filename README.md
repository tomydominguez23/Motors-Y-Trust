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

El enlace **Panel de administración** está en el pie de página (`admin/`).

### Acceso al panel admin (Supabase Auth)

El login del panel usa **Supabase Authentication**, no la tabla `customers`:

1. En el dashboard de Supabase: **Authentication → Users → Add user**
2. Indica email y contraseña, y activa **Auto Confirm User** (o confirma el correo manualmente)
3. Si el login falla con «email not confirmed», desactiva **Confirm email** en **Authentication → Providers → Email**

Si creaste el usuario solo en **Table Editor** o en la tabla `customers`, no podrás iniciar sesión hasta crearlo en **Authentication**.
