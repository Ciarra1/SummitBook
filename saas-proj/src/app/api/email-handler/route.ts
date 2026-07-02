// app/api/email-handler/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, firstName } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: 'MCApp <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome!',
      html: `<p>Hi ${firstName}, welcome aboard!</p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}