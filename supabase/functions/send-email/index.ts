const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get Resend API key from Supabase Secrets
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('Error: RESEND_API_KEY is not set in Supabase environment secrets.')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY is missing from Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse payload from webhook trigger
    const body = await req.json()
    console.log("Received Webhook Payload:", JSON.stringify(body, null, 2))

    // Support database webhook event structure (body.record) or direct invocation
    const record = body.record || body
    const name = record.name || 'Subscriber'
    const email = record.email
    const how_heard = record.referral || record.how_heard || record.source || 'Not specified'
    const country = record.country || req.headers.get('cf-ipcountry') || 'Unknown'

    // Extract IP from Supabase/Cloudflare headers
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'Unknown'

    if (!email) {
      console.error('Error: Email address is missing from the record.')
      return new Response(
        JSON.stringify({ error: 'No email found in payload record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending welcome email to: ${email} (${name})`)

    // 3. Email layout (HTML content)
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaebed; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
        
        <!-- Main Content -->
        <div style="padding: 40px 32px; color: #333333;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #333333;">Hi ${name},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">Thank you for joining the waitlist for <strong>Tathastu Ai™</strong>.</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">
            Before we launch, we’d love to hear from you.<br>
            What are you looking for in the perfect video platform?
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">
            Take this quick 1-minute survey to help us build something you'll love:<br>
            👉 <a href="https://forms.gle/EKu3pcyg5Et8dfuZ9" style="color: #2563eb; text-decoration: none; font-weight: bold;">https://forms.gle/EKu3pcyg5Et8dfuZ9</a>
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">
            <strong>Why Your Answers Matter?</strong><br>
            Your input will directly shape how Tathastu looks, feels, and works.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">
            Thanks again for being an early supporter. We’ll keep you updated with exclusive early access invites, behind-the-scenes progress, and more.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0; color: #333333;">
            Warmly,<br>
            <strong>Team Tathastu Ai™</strong><br>
            So be it.
          </p>
        </div>
        
        <!-- Footer Section -->
        <div style="background-color: #f8f9fa; padding: 32px; text-align: center; border-top: 1px solid #eaebed;">
          <p style="font-size: 14px; color: #666666; margin-top: 0; margin-bottom: 16px;">Connect with us:</p>
          
          <div style="margin-bottom: 24px;">
            <a href="https://www.instagram.com/tathastuai?igsh=MTdoM3Z1bnZsaTh2Nw==" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img src="https://img.icons8.com/fluency/48/instagram-new.png" alt="Instagram" width="28" height="28" style="vertical-align: middle;">
            </a>
            <a href="https://x.com/Tathastuai?s=09" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img src="https://img.icons8.com/fluency/48/twitterx.png" alt="X" width="28" height="28" style="vertical-align: middle;">
            </a>
            <a href="https://youtube.com/@tathastuai?si=0NJQ57G-gSX5OzAM" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img src="https://img.icons8.com/fluency/48/youtube-play.png" alt="YouTube" width="28" height="28" style="vertical-align: middle;">
            </a>
            <a href="https://www.linkedin.com/company/tathastuai" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img src="https://img.icons8.com/fluency/48/linkedin.png" alt="LinkedIn" width="28" height="28" style="vertical-align: middle;">
            </a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; color: #888888; margin: 0 auto 12px auto; max-width: 400px;">
            You're receiving this because you joined the waitlist at <a href="https://tathastuai.com" style="color: #2563eb; text-decoration: none;">tathastuai.com</a>.<br>
            We respect your inbox and will only send high-signal updates.
          </p>
          
          <p style="font-size: 12px; color: #a0a0a0; margin: 0;">
            © 2026 Tathastu AI. All rights reserved.
          </p>
        </div>
        
      </div>
    `

    // 4. Send Welcome Email to the User
    const userRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Tathastu AI <noreply@tathastuai.in>',
        to: email,
        subject: 'Welcome to the Tathastu AI Waitlist! 🎉',
        html: htmlContent,
      }),
    })

    const userResBody = await userRes.json()
    console.log('Resend (User) Response Code:', userRes.status)

    if (!userRes.ok) {
      throw new Error(`Resend User API Error: ${userResBody.message || JSON.stringify(userResBody)}`)
    }

    // 5. Send Notification Email to Dhruv
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Tathastu AI <noreply@tathastuai.in>',
        to: 'dhruv@tathastuai.in', // Sending notification here
        subject: `New Waitlist Signup: ${name}`,
        html: `
          <h3>New Waitlist Signup!</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>How they heard:</strong> ${how_heard}</p>
          <p><strong>Country:</strong> ${country}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
        `,
      }),
    })

    const adminResBody = await adminRes.json()
    console.log('Resend (Admin) Response Code:', adminRes.status)

    if (!adminRes.ok) {
      console.error(`Resend Admin API Error: ${adminResBody.message || JSON.stringify(adminResBody)}`)
      // Not throwing error here so we still return success to the user even if admin email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Emails sent successfully', data: userResBody }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
