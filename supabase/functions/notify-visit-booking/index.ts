import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatChileDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildDealerMessage(apt: Record<string, unknown>, vehicle: Record<string, unknown> | null) {
  const vehLabel = vehicle
    ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
    : 'Vehículo sin referencia';
  const lines = [
    '🚗 *Nueva visita agendada — Trust Motors*',
    '',
    `*Vehículo:* ${vehLabel}`,
    `*Cliente:* ${apt.customer_name}`,
    `*Teléfono:* ${apt.customer_phone}`,
    `*Fecha y hora:* ${formatChileDate(String(apt.scheduled_at))}`,
  ];
  if (apt.customer_email) lines.push(`*Email:* ${apt.customer_email}`);
  if (apt.notes) lines.push(`*Notas:* ${apt.notes}`);
  lines.push('', `ID: ${apt.id}`);
  return lines.join('\n');
}

function normalizePhone(phone: string) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('56')) return digits;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  return digits;
}

async function sendViaMeta(token: string, phoneNumberId: string, to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(to),
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp Cloud API: ${err}`);
  }
}

async function sendViaCallMeBot(to: string, text: string, apikey: string) {
  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', normalizePhone(to));
  url.searchParams.set('text', text);
  url.searchParams.set('apikey', apikey);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CallMeBot: ${err}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const appointment_id = body?.appointment_id;
    const notify = body?.notify;

    if (!appointment_id && !notify) {
      return json({ ok: false, error: 'appointment_id or notify payload required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, reason: 'server_misconfigured' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let apt: Record<string, unknown>;
    let vehicle: Record<string, unknown> | null = null;

    if (appointment_id) {
      const { data, error } = await supabase
        .from('visit_appointments')
        .select('*, vehicles(brand, model, year)')
        .eq('id', appointment_id)
        .maybeSingle();

      if (error || !data) {
        return json({ ok: false, error: error?.message || 'Appointment not found' }, 404);
      }
      apt = data as Record<string, unknown>;
      const v = apt.vehicles;
      vehicle = (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | null;
    } else {
      apt = {
        customer_name: notify.customer_name,
        customer_phone: notify.customer_phone,
        customer_email: notify.customer_email || '',
        scheduled_at: notify.scheduled_at,
        notes: notify.notes || '',
        id: notify.id || 'web',
      };
      if (notify.vehicle_label) {
        const parts = String(notify.vehicle_label).trim().split(/\s+/);
        const year = parts.length > 2 ? parts.pop() : '';
        vehicle = {
          brand: parts[0] || '',
          model: parts.slice(1).join(' ') || '',
          year: year || '',
        };
      }
    }

    const message = buildDealerMessage(apt, vehicle);
    const dealerPhone = Deno.env.get('DEALER_WHATSAPP_PHONE') || '56948406684';

    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const callMeBotKey = Deno.env.get('CALLMEBOT_APIKEY');

    let method: string | null = null;

    if (waToken && waPhoneId) {
      await sendViaMeta(waToken, waPhoneId, dealerPhone, message);
      method = 'whatsapp_cloud';
    } else if (callMeBotKey) {
      await sendViaCallMeBot(dealerPhone, message, callMeBotKey);
      method = 'callmebot';
    } else {
      return json({
        ok: false,
        reason: 'not_configured',
        hint: 'Configura WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID o CALLMEBOT_APIKEY en la Edge Function.',
      });
    }

    if (appointment_id) {
      await supabase
        .from('visit_appointments')
        .update({ whatsapp_notified: true })
        .eq('id', appointment_id);
    }

    return json({ ok: true, method });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, 500);
  }
});
