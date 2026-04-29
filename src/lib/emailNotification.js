import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key
const initializeEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!publicKey) {
    console.error('EmailJS public key is not set in environment variables');
    return;
  }
  emailjs.init(publicKey);
};

// Initialize on module load
initializeEmailJS();

/**
 * Send email notifications for business operations
 * @param {string} type - Type of notification: "order" or "low_stock"
 * @param {object} data - Data object containing notification details
 * @returns {Promise<object>} - Response from EmailJS
 */
export const sendEmailNotification = async (type, data) => {
  try {
    let serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    let publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    let templateId;
    let templateParams;

    if (type === 'order') {
      // Validate order data
      if (!data.customerName || !data.productName || !data.quantity || !data.orderNumber) {
        throw new Error('Missing required order data: customerName, productName, quantity, orderNumber');
      }

      templateId = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;
      templateParams = {
        to_email: import.meta.env.VITE_BUSINESS_EMAIL,
        customer_name: data.customerName,
        product_name: data.productName,
        quantity: data.quantity,
        order_number: data.orderNumber,
        total_price: data.totalPrice || 'N/A',
        order_date: new Date().toLocaleDateString(),
      };
    } else if (type === 'low_stock') {
      // Validate low stock data
      if (!data.itemName || data.remainingQuantity === undefined) {
        throw new Error('Missing required low stock data: itemName, remainingQuantity');
      }

      templateId = import.meta.env.VITE_EMAILJS_LOW_STOCK_TEMPLATE_ID;
      templateParams = {
        to_email: import.meta.env.VITE_BUSINESS_EMAIL,
        item_name: data.itemName,
        remaining_quantity: data.remainingQuantity,
        alert_level: data.alertLevel || 'Low inventory warning',
        timestamp: new Date().toLocaleString(),
      };
    } else if (type === 'processing') {
      serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID_2 || serviceId;
      publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY_2 || publicKey;

      if (!data.customerName || !data.customerEmail || !data.orderNumber) {
        throw new Error('Missing required processing data: customerName, customerEmail, orderNumber');
      }
      templateId = import.meta.env.VITE_EMAILJS_PROCESSING_TEMPLATE_ID_2;
      templateParams = {
        to_email: data.customerEmail,
        customer_email: data.customerEmail,
        email: data.customerEmail,
        customer_name: data.customerName,
        order_number: data.orderNumber,
        order_date: data.orderDate || new Date().toLocaleDateString(),
        order_items: data.orderItems || 'Your items',
        order_total: data.orderTotal || 'N/A',
        delivery_method: data.deliveryMethod || 'Pickup/Delivery',
        store_name: data.storeName || 'Nuestras Artesanías',
        store_address: data.storeAddress || 'Corozal Town, Belize',
        support_email: data.supportEmail || 'benporll13@gmail.com',
        status: 'Processing',
        message: 'Great news! We have started processing your order.',
        date: new Date().toLocaleDateString(),
      };
    } else if (type === 'ready') {
      serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID_2 || serviceId;
      publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY_2 || publicKey;

      if (!data.customerName || !data.customerEmail || !data.orderNumber) {
        throw new Error('Missing required ready data: customerName, customerEmail, orderNumber');
      }
      templateId = import.meta.env.VITE_EMAILJS_READY_TEMPLATE_ID_2;
      templateParams = {
        to_email: data.customerEmail,
        customer_email: data.customerEmail,
        email: data.customerEmail,
        customer_name: data.customerName,
        order_number: data.orderNumber,
        order_date: data.orderDate || new Date().toLocaleDateString(),
        order_items: data.orderItems || 'Your items',
        order_total: data.orderTotal || 'N/A',
        delivery_method: data.deliveryMethod || 'Pickup/Delivery',
        store_name: data.storeName || 'Nuestras Artesanías',
        store_address: data.storeAddress || 'Corozal Town, Belize',
        support_email: data.supportEmail || 'benporll13@gmail.com',
        status: 'Ready',
        message: 'Your order is ready!',
        date: new Date().toLocaleDateString(),
      };
    } else if (type === 'delivery') {
      serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID_3 || serviceId;
      publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY_3 || publicKey;

      if (!data.customerName || !data.customerEmail || !data.orderNumber) {
        throw new Error('Missing required delivery data: customerName, customerEmail, orderNumber');
      }
      templateId = import.meta.env.VITE_EMAILJS_DELIVERY_TEMPLATE_ID_3;
      templateParams = {
        to_email: data.customerEmail,
        customer_email: data.customerEmail,
        email: data.customerEmail,
        customer_name: data.customerName,
        order_number: data.orderNumber,
        order_date: data.orderDate || new Date().toLocaleDateString(),
        order_items: data.orderItems || 'Your items',
        order_total: data.orderTotal || 'N/A',
        delivery_method: data.deliveryMethod || 'Pickup/Delivery',
        delivery_address: data.deliveryMethod || 'Pickup/Delivery',
        store_name: data.storeName || 'Nuestras Artesanías',
        store_address: data.storeAddress || 'Corozal Town, Belize',
        support_email: data.supportEmail || 'benporll13@gmail.com',
        status: 'Out for Delivery',
        message: 'Your order is out for delivery and will arrive soon.',
        date: new Date().toLocaleDateString(),
      };
    } else if (type === 'paid') {
      serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID_3 || serviceId;
      publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY_3 || publicKey;

      if (!data.customerName || !data.customerEmail || !data.orderNumber) {
        throw new Error('Missing required paid data: customerName, customerEmail, orderNumber');
      }
      templateId = import.meta.env.VITE_EMAILJS_PAID_TEMPLATE_ID_3;
      templateParams = {
        to_email: data.customerEmail,
        customer_email: data.customerEmail,
        email: data.customerEmail,
        customer_name: data.customerName,
        order_number: data.orderNumber,
        order_date: data.orderDate || new Date().toLocaleDateString(),
        order_total: data.orderTotal || 'N/A',
        payment_method: data.paymentMethod || '',
        transaction_id: data.transactionId || '',
        subtotal: data.subtotal || '',
        tax: data.tax || '',
        item_1_name: data.item_1_name || '',
        item_1_qty: data.item_1_qty || '',
        item_1_price: data.item_1_price || '',
        item_1_total: data.item_1_total || '',
        item_2_name: data.item_2_name || '',
        item_2_qty: data.item_2_qty || '',
        item_2_price: data.item_2_price || '',
        item_2_total: data.item_2_total || '',
        item_3_name: data.item_3_name || '',
        item_3_qty: data.item_3_qty || '',
        item_3_price: data.item_3_price || '',
        item_3_total: data.item_3_total || '',
        store_name: data.storeName || 'Nuestras Artesanías',
        store_address: data.storeAddress || 'Corozal Town, Belize',
        support_email: data.supportEmail || 'benporll13@gmail.com',
      };
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }

    if (!serviceId || !publicKey) {
      throw new Error('EmailJS configuration is missing in environment variables');
    }

    if (!templateId) {
      throw new Error(`EmailJS template ID for ${type} is not set in environment variables`);
    }

    // Send email via EmailJS
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);

    console.log(`${type} email sent successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending ${type} email:`, error.message);
    throw error;
  }
};

/**
 * Send order confirmation email to business owner
 * @param {object} orderData - Order information
 * @returns {Promise<object>}
 */
export const sendOrderNotification = async (orderData) => {
  return sendEmailNotification('order', {
    customerName: orderData.customer_name,
    productName: orderData.product_name,
    quantity: orderData.quantity,
    orderNumber: orderData.order_id,
    totalPrice: orderData.total_price,
  });
};

/**
 * Send low stock alert email to business owner
 * @param {object} inventoryData - Inventory information
 * @returns {Promise<object>}
 */
export const sendLowStockAlert = async (inventoryData) => {
  return sendEmailNotification('low_stock', {
    itemName: inventoryData.product_name,
    remainingQuantity: inventoryData.stock_quantity,
    alertLevel: inventoryData.alert_level,
  });
};

/**
 * Send status update email to customer
 * @param {string} status - One of: 'processing', 'ready', 'delivery'
 * @param {object} orderData - Customer and order information
 * @returns {Promise<object>}
 */
export const sendCustomerStatusEmail = async (status, orderData) => {
  return sendEmailNotification(status, {
    customerName: orderData.customer_name,
    customerEmail: orderData.customer_email,
    orderNumber: orderData.order_id,
    orderDate: orderData.order_date,
    orderItems: orderData.order_items,
    orderTotal: orderData.order_total,
    deliveryMethod: orderData.delivery_method,
    paymentMethod: orderData.payment_method,
    transactionId: orderData.transaction_id,
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    item_1_name: orderData.item_1_name,
    item_1_qty: orderData.item_1_qty,
    item_1_price: orderData.item_1_price,
    item_1_total: orderData.item_1_total,
    item_2_name: orderData.item_2_name,
    item_2_qty: orderData.item_2_qty,
    item_2_price: orderData.item_2_price,
    item_2_total: orderData.item_2_total,
    item_3_name: orderData.item_3_name,
    item_3_qty: orderData.item_3_qty,
    item_3_price: orderData.item_3_price,
    item_3_total: orderData.item_3_total,
    storeName: orderData.store_name,
    storeAddress: orderData.store_address,
    supportEmail: orderData.support_email,
  });
};
