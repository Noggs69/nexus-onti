import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Necesitarás esta key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar nodemailer (ajusta según tu proveedor de email)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function processEmailQueue() {
  try {
    // Obtener emails pendientes
    const { data: emails, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('No pending emails');
      return;
    }

    console.log(`Processing ${emails.length} emails...`);

    for (const email of emails) {
      try {
        // Enviar email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"NEXUS" <noreply@nexus.com>',
          to: email.to_email,
          subject: email.subject,
          text: email.body,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Nueva Conversación</h2>
              <div style="white-space: pre-line; line-height: 1.6;">
                ${email.body}
              </div>
              ${email.conversation_id ? `
                <a href="http://localhost:5173/chat?conversation=${email.conversation_id}" 
                   style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                          background-color: #2563eb; color: white; text-decoration: none; 
                          border-radius: 6px;">
                  Ver Conversación
                </a>
              ` : ''}
            </div>
          `,
        });

        // Marcar como enviado
        await supabase
          .from('email_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', email.id);

        console.log(`Email sent to ${email.to_email}`);
      } catch (err) {
        console.error(`Failed to send email to ${email.to_email}:`, err);
      }
    }
  } catch (err) {
    console.error('Error processing email queue:', err);
  }
}

// Ejecutar cada 30 segundos
setInterval(processEmailQueue, 30000);

// Ejecutar inmediatamente
processEmailQueue();

console.log('Email service started. Checking for new emails every 30 seconds...');
