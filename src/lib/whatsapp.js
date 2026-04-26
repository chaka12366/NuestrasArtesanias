import axios from 'axios';

/**
 * Normalizes a phone number for the WhatsApp API.
 * Removes spaces, dashes, and special characters.
 * Ensures the number starts with the country code (501 for Belize).
 */
export const normalizePhone = (phone) => {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  let cleaned = phone.toString().replace(/[^0-9]/g, '');
  
  // If the number is exactly 7 digits (local Belize number), prepend country code '501'
  if (cleaned.length === 7) {
    cleaned = "501" + cleaned;
  }
  
  return cleaned;
};

/**
 * Validates a phone number.
 * Returns true if the phone number is valid for WhatsApp usage.
 */
export const validatePhone = (phone) => {
  const normalized = normalizePhone(phone);
  // Basic validation: must be at least 10 digits and only numbers
  return /^\d{10,}$/.test(normalized);
};

/**
 * Generates a professional and user-friendly WhatsApp message based on order status.
 */
export const generateOrderMessage = (customerName, orderId, status, itemsStr, total) => {
  const name = customerName && customerName !== 'Guest' ? customerName.split(' ')[0] : "there";
  
  let statusText = "";
  let customMessage = "";

  switch (status.toLowerCase()) {
    case 'pending':
      statusText = "🟡 Pending";
      customMessage = "We've received your order and will review it shortly. We'll keep you updated as we start working on it! ✨";
      break;
    case 'in-progress':
      statusText = "🟠 In Progress";
      customMessage = "We are currently preparing your order. It's coming together beautifully! 🎨";
      break;
    case 'ready':
      statusText = "🔵 Ready";
      customMessage = "Great news! Your order is now ready. Please let us know if you have any questions about your pickup or delivery. 🎉";
      break;
    case 'delivered':
      statusText = "🟢 Delivered";
      customMessage = "We see that your order has been delivered. We hope you love it! 🌟";
      break;
    default:
      statusText = "⚪ Update";
      customMessage = "We're reaching out with a quick update regarding your order.";
      break;
  }

  const itemsList = itemsStr ? itemsStr.split(', ').map(item => `• ${item}`).join('\n') : "• Items details hidden";
  const totalSection = total ? `\n💵 *Total:* $${Number(total).toFixed(2)} BZD` : "";

  return `Hi ${name}! 👋\n\n*Nuestras Artesanías Order Update*\n\n🏷️ *Order ID:* #${orderId}\n📦 *Status:* ${statusText}\n\n🛍️ *Items Ordered:*\n${itemsList}${totalSection}\n\n${customMessage}\n\nThank you for supporting our craft! ❤️`;
};

/**
 * Generates the WhatsApp API link with a pre-filled message.
 */
export const getWhatsAppLink = (phone, message) => {
  if (!validatePhone(phone)) return null;
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

/**
 * Sends a message automatically via WhatsApp Business API (Meta Official)
 * Requires: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN environment variables
 * 
 * @param {string} recipientPhone - Customer's phone number (with or without country code)
 * @param {string} message - Message content
 * @returns {Promise<object>} - API response or error
 */
export const sendWhatsAppMessage = async (recipientPhone, message) => {
  try {
    // Get credentials from environment variables
    const phoneNumberId = process.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.VITE_WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('WhatsApp API credentials not configured');
      return {
        success: false,
        error: 'WhatsApp credentials missing. Configure VITE_WHATSAPP_PHONE_NUMBER_ID and VITE_WHATSAPP_ACCESS_TOKEN'
      };
    }

    if (!validatePhone(recipientPhone)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const normalized = normalizePhone(recipientPhone);

    // Meta WhatsApp Business API endpoint
    const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalized,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Sends an order update automatically via WhatsApp (no manual input needed)
 */
export const sendOrderUpdateWhatsApp = async (customerPhone, customerName, orderId, status, itemsStr, total) => {
  const message = generateOrderMessage(customerName, orderId, status, itemsStr, total);
  return await sendWhatsAppMessage(customerPhone, message);
};
