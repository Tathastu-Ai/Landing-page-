import express from 'express';
import cors from 'cors';
import fs from 'fs';

// Load local .env file variables if present
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const app = express();

// Allow requests from your frontend
app.use(cors());
app.use(express.json());

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn("⚠️ Warning: RESEND_API_KEY environment variable is not set. Emails will fail to send.");
}

app.set('trust proxy', true);

app.post('/send-email', async (req, res) => {
  const { name, email, country, referral } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
  const ua = req.headers['user-agent'] || 'Unknown';

  try {
    // 1. Send welcome email to user
    const userResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Tathastu AI <noreply@tathastuai.in>',
        to: email,
        subject: 'Welcome to the Tathastu AI Waitlist! 🎉',
        html: `
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
    `,
      }),
    });

    // 2. Send notification email to Admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>New signup:</p>
        <p>Name: ${name}</p>
        <p>Email: <a href="mailto:${email}">${email}</a></p>
        <p>Country: ${country || 'N/A'}</p>
        <p>Referral: ${referral || 'N/A'}</p>
        <p>IP: ${ip}</p>
        <p>UA: ${ua}</p>
      </div>
    `;

    const adminResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Tathastu AI <noreply@tathastuai.in>',
        to: 'dhruv@tathastuai.com',
        subject: `New Waitlist Signup: ${name}`,
        html: adminHtml,
      }),
    });

    const userData = await userResponse.json();
    const adminData = await adminResponse.json();

    if (userResponse.ok && adminResponse.ok) {
      res.json({ success: true, userData, adminData });
    } else {
      res.status(400).json({ error: 'One or both emails failed to send', userData, adminData });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Simple backend is running on http://localhost:${PORT}`);
});
