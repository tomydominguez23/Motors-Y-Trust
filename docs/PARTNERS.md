# Partners (logos animados en el inicio)

## Qué hace

- En la página de inicio aparece la sección **Nuestros Partners** con logos en una franja que se mueve hacia la izquierda.
- En el panel hay un menú **Partners** para crear, editar y eliminar logos.

## 1. Crear la tabla en Supabase

En **SQL Editor**, ejecuta:

`sql/partners.sql`

Asegúrate de tener el bucket de storage **`site`** (ya se usa para logos/hero). Si falta, ejecuta también `sql/setup_completo.sql`.

## 2. Usar el panel

1. Entra a `panel.html` (o `/admin/`).
2. Menú **Partners** → **Nuevo Partner**.
3. Completa nombre, sube el logo (PNG/SVG preferible) y opcionalmente el sitio web y el orden.
4. Marca **Activo** para que se vea en la web.

## 3. Sitio público

Al recargar `index.html`, los partners activos aparecen automáticamente. Si no hay ninguno, la sección se oculta.
