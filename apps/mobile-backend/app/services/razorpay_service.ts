import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance safely (avoid crashing on startup if missing in dev)
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret || key_secret === 'PASTE_FULL_SECRET_HERE') {
      throw new Error("Razorpay credentials are not fully configured in .env");
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

/**
 * Creates a new Razorpay order.
 * @param amountInRupees The amount in INR (e.g. 500.50)
 * @param receiptId A unique identifier for the receipt (e.g. user ID or timestamp)
 * @returns The Razorpay Order object containing the `id`
 */
export const createOrder = async (amountInRupees: number, receiptId: string) => {
  const rzp = getRazorpayInstance();
  
  // Razorpay expects amount in the smallest currency sub-unit (paise for INR)
  const amountInPaise = Math.round(amountInRupees * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId,
  };

  try {
    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error('[Razorpay] Order Creation Error:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

/**
 * Verifies the Razorpay payment signature.
 * @param razorpay_order_id The order ID returned during creation
 * @param razorpay_payment_id The payment ID returned after successful payment
 * @param razorpay_signature The signature returned after successful payment
 * @returns boolean true if the signature is valid
 */
export const verifyPaymentSignature = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean => {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret || key_secret === 'PASTE_FULL_SECRET_HERE') {
    throw new Error("Razorpay credentials are not fully configured in .env");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpay_signature;
};
