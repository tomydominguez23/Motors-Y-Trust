# Agendar visita + notificación WhatsApp

## Qué hace el sitio

1. En la ficha del vehículo (`vehiculo.html`) el cliente puede pulsar **Agendar visita**, elegir fecha/hora y dejar sus datos.
2. La reserva se guarda en Supabase (`visit_appointments`).
3. Se llama a la Edge Function `notify-visit-booking`, que envía un WhatsApp automático al número del negocio.
4. En el **panel** aparece la sección **Visitas** para revisar y confirmar.

## 1. Crear la tabla en Supabase

En **SQL Editor**, ejecuta el archivo:

`sql/visit_appointments.sql`

## 2. Desplegar la Edge Function

Instala [Supabase CLI](https://supabase.com/docs/guides/cli) y enlaza el proyecto:

```bash
supabase login
supabase link --project-ref rjsfkrgsyduiwyamhdkg
supabase functions deploy notify-visit-booking
```

## 3. Variables de entorno (Edge Function)

En **Project Settings → Edge Functions → Secrets**, configura al menos una opción:

### Opción A — WhatsApp Cloud API (Meta, recomendada en producción)

| Secret | Descripción |
|--------|-------------|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente de la app Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp Business |
| `DEALER_WHATSAPP_PHONE` | Tu número (ej. `56948406684`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Se inyecta automáticamente al desplegar |

El número del negocio debe poder recibir mensajes desde tu cuenta Business (ventana de 24 h o plantilla aprobada).

### Opción B — CallMeBot (rápida para pruebas)

1. Añade el contacto **CallMeBot** en WhatsApp y obtén tu API key.
2. Configura `CALLMEBOT_APIKEY` y `DEALER_WHATSAPP_PHONE`.

Documentación: https://www.callmebot.com/blog/free-api-whatsapp-messages/

## 4. Probar

1. Abre un vehículo en el sitio → **Agendar visita**.
2. Completa el formulario y confirma.
3. Deberías recibir el mensaje en WhatsApp y ver la visita en **Panel → Visitas**.

Si la función no está configurada, la visita **sí se guarda** en la base de datos; solo fallará el envío automático (revisa logs en Supabase → Edge Functions).
