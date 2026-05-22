import { OtpProvider } from './OtpProvider';
import { TwilioProvider } from './TwilioProvider';
import { MockProvider } from './MockProvider';

export class OtpFactory {
  /**
   * Returns the appropriate OTP provider based on environment configuration.
   */
  static getProvider(): OtpProvider {
    const isProd = process.env.NODE_ENV === 'production';
    const hasKeys = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

    // If we have keys and want real SMS, use Twilio
    if (hasKeys && process.env.TWILIO_VERIFY_SERVICE_SID) {
      return new TwilioProvider();
    }

    // Default to Mock for development
    return new MockProvider();
  }
}
