# Restaurar el sitio en cPanel (carpeta vacía o borrada)

Si borraste archivos en el **Administrador de archivos** y la web quedó en blanco, o el deploy de GitHub falla con **"Home directory not available"**, sigue estos pasos en orden.

---

## Paso 1 — Recrear la carpeta del sitio en cPanel

1. Entra a **cPanel** → **Administrador de archivos**.
2. Ve a tu carpeta de usuario (ej. `home/tuusuario/`).
3. Si no existe, **crea la carpeta** `public_html` (clic derecho → Crear carpeta).
4. Abre `public_html` — ahí debe vivir la web de **trustmotors.cl**.

---

## Paso 2 — Revisar la cuenta FTP (importante)

1. cPanel → **Cuentas FTP**.
2. Busca la cuenta que usa el deploy (ej. `Admin@trustmotors.cl`).
3. Clic en **Cambiar directorio** / **Change Directory**.
4. Asígnala a **`public_html`** (o la carpeta que creaste en el paso 1).
5. Si la cuenta quedó rota, puedes **eliminarla y crearla de nuevo** apuntando a `public_html`.

Sin esto, GitHub Actions no podrá subir archivos (error 530).

---

## Paso 3 — Subir el sitio (elige A o B)

### Opción A — Manual (rápida, sin GitHub)

1. Descarga el código actual:  
   https://github.com/tomydominguez23/Motors-Y-Trust/archive/refs/heads/main.zip
2. Descomprime el ZIP en tu computador.
3. En cPanel → **Administrador de archivos** → entra a **`public_html`**.
4. Sube **todo el contenido** del ZIP **excepto**:
   - carpeta `.github`
   - carpeta `docs`
   - carpeta `sql`
   - `README.md`
5. Debe quedar en `public_html` al menos:
   - `index.html`, `app.js`, `styles.css`
   - `vehiculo.html`, `vehiculo.js`, `vehiculo.css`
   - `finance-utils.js`, `panel.html`, `panel.css`, `panel.js`
   - carpetas `admin/`, `js/` (con sus archivos)
   - `.htaccess` (activa “mostrar archivos ocultos” al subir)
6. Abre **https://trustmotors.cl** y **https://trustmotors.cl/panel.html** (Ctrl+Shift+R).

### Opción B — Automática con GitHub (después de arreglar FTP)

1. En GitHub: repo **Motors-Y-Trust** → **Actions** → **Deploy to cPanel (FTP)**.
2. Clic **Run workflow** → rama `main` → **Run workflow**.
3. Espera el check verde (1–2 minutos).
4. Revisa que en `public_html` aparezcan los archivos.

Secret `CPANEL_REMOTE_DIR` en GitHub:

| Si al conectar por FTP entras directo en `public_html` | Usa `/` |
| Si entras en la raíz del usuario y ves la carpeta `public_html` | Usa `/public_html/` |

---

## Paso 4 — Comprobar

| URL | Debe mostrar |
|-----|----------------|
| https://trustmotors.cl/ | Página principal |
| https://trustmotors.cl/panel.html | Panel de administración |
| https://trustmotors.cl/finance-utils.js | Código JavaScript (no error 500) |

---

## Supabase (datos de autos)

Los vehículos **no** se borran al vaciar cPanel: están en **Supabase**. Solo se restauran los archivos HTML/JS/CSS.

Si el panel no guarda, ejecuta en Supabase → SQL Editor el archivo `sql/setup_completo.sql` o `sql/open_admin_no_auth.sql` según lo que indique el panel.

---

## Resumen

1. Crear `public_html` si falta.  
2. Apuntar la cuenta FTP a esa carpeta.  
3. Subir el ZIP manual **o** ejecutar el workflow en Actions.  
4. Usar **panel.html** para administrar.
