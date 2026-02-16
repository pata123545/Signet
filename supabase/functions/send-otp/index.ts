import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, otp } = await req.json();
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

        if (!RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY');
        }

        // Premium HTML Design (Gold / Pearl White / Black)
        const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <style>
        /* Pearl / Off-White Background */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.03); }
        .header { background: #000000; padding: 40px 20px; text-align: center; position: relative; }
        /* Gold Accent Line */
        .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #D4AF37, #F3E5AB, #D4AF37); }
        .logo { color: #ffffff; font-size: 24px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase; margin: 0; }
        .content { padding: 40px 30px; text-align: center; }
        .title { color: #1a1a1a; font-size: 22px; font-weight: 800; margin-bottom: 10px; }
        .text { color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
        /* Code Container with Gold Border */
        .code-container { background: #FDFDFD; border: 2px solid #D4AF37; border-radius: 12px; padding: 25px; display: inline-block; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15); }
        .code { color: #D4AF37; font-size: 38px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 0; line-height: 1; }
        .footer { background: #F9F9F9; padding: 20px; text-align: center; font-size: 11px; color: #999999; border-top: 1px solid #eeeeee; letter-spacing: 1px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">SIGNET</h1>
        </div>
        <div class="content">
          <h2 class="title">אימות גישה מאובטח</h2>
          <p class="text">הוזמנת לצפות בהצעת מחיר מאובטחת.<br>אנא השתמש בקוד החד-פעמי הבא:</p>
          
          <div class="code-container">
            <div class="code">${otp}</div>
          </div>
          
          <p class="text" style="font-size: 13px; color: #999;">קוד זה תקף ל-15 דקות בלבד.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Signet Security. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // STRICT: Must be this for testing
                to: email, // Directly use email string, assuming validation done before/in RPC
                subject: 'קוד גישה מאובטח',
                html: htmlContent,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Error sending email:', data);
            return new Response(JSON.stringify(data), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ sent: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
