export interface OtpResponse {
  success: boolean;
  message: string;
  status?: string;
}

export abstract class OtpProvider {
  /**
   * Send an OTP to the specified phone number.
   * @param phone The 10-digit phone number.
   */
  abstract send(phone: string): Promise<OtpResponse>;

  /**
   * Verify the OTP for the specified phone number.
   * @param phone The 10-digit phone number.
   * @param code The 6-digit OTP code to verify.
   */
  abstract verify(phone: string, code: string): Promise<boolean>;
}
