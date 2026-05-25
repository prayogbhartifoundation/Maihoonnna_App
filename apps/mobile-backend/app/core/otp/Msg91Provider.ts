import prisma from '../database';
import { OtpProvider, OtpResponse } from './OtpProvider';

export class Msg91Provider extends OtpProvider {
  /**
   * Send an OTP via MSG91 WhatsApp API.
   */
  async send(phone: string): Promise<OtpResponse> {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      throw new Error('MSG91_AUTH_KEY is not configured');
    }

    // Generate a 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database
    await prisma.otp.upsert({
      where: { phone },
      update: { code: otpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      create: { phone, code: otpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    });

    const payload = {
      integrated_number: "919911883075",
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: "testing3",
          language: {
            code: "en",
            policy: "deterministic"
          },
          namespace: "544a2f73_cae8_4083_ba83_e032414c29e0",
          to_and_components: [
            {
              to: [ `91${phone}` ], // phone is guaranteed to be 10 digits by auth_service
              components: {
                body_1: {
                  type: "text",
                  value: otpCode
                },
                button_1: {
                  subtype: "url",
                  type: "text",
                  value: otpCode
                }
              }
            }
          ]
        }
      }
    };

    try {
      const response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log(`[MSG91] Response for ${phone}:`, data);

      if (data.hasError) {
         throw new Error(`MSG91 Error: ${data.message || JSON.stringify(data)}`);
      }

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp',
      };
    } catch (error: any) {
      console.error('[MSG91] Request Failed:', error);
      throw new Error('Failed to send OTP via WhatsApp');
    }
  }

  /**
   * Verify an OTP from the database.
   */
  async verify(phone: string, code: string): Promise<boolean> {
    // Universal bypass for testing if needed
    if (code === '442233') {
      console.log(`\n\n[DEV MODE] Using universal OTP '442233' for ${phone}\n\n`);
      return true;
    }

    const otpRecord = await prisma.otp.findUnique({ where: { phone } });

    if (!otpRecord) return false;
    if (otpRecord.code !== code) return false;
    if (otpRecord.expiresAt < new Date()) return false;

    // Consume the token on success
    await prisma.otp.delete({ where: { phone } });
    return true;
  }
}
