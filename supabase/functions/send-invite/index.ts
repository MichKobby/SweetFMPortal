// Supabase Edge Function to send invitation emails
// Deploy with: supabase functions deploy send-invite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface InvitePayload {
  email: string
  token: string
  role: string
  inviterName: string
  appUrl: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email, token, role, inviterName, appUrl }: InvitePayload = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const inviteLink = `${appUrl}/invite/${token}`

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sweet FM <noreply@sweetfmonline.com>',
        to: [email],
        subject: "You've been invited to join Sweet FM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #c81f25;">
              <img src="${appUrl}/logo.png" alt="Sweet FM 106.5" style="max-width: 200px; height: auto;" />
            </div>
            
            <div style="padding: 40px 20px; background: #f9fafb;">
              <h2 style="color: #111827; margin: 0 0 20px 0;">You're Invited!</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join the SweetFM Management Platform as a <strong>${role}</strong>.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Click the button below to create your account and get started:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background: #c81f25; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #c81f25;">${inviteLink}</a>
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #111827;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Sweet FM 106.5. All rights reserved.
              </p>
            </div>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
