import { supabase } from './supabase.js'
import { sendOrderNotification, sendLowStockAlert, sendCustomerStatusEmail } from './emailNotification.js'

const LOW_STOCK_THRESHOLD = 6

function normalizeShippingMethod(label) {
  const labelToCode = {
    'Standard delivery': 'standard',
    'Express delivery': 'express',
    'Pick up in Corozal': 'pickup',
  }
  return labelToCode[label] || 'standard'
}

function normalizePaymentMethod(label) {
  const labelToCode = {
    'Cash on delivery': 'cash_on_delivery',
    'Bank transfer': 'bank_transfer',
    'Card (coming soon)': 'card',
    'Card': 'card',
  }
  return labelToCode[label] || 'cash_on_delivery'
}

export async function placeOrder(orderData, cartItems) {
  try {

  const productIds = cartItems.map(item => item.id)
  const { data: products, error: stockCheckError } = await supabase
    .from('products')
    .select('id, name, stock')
    .in('id', productIds)

  if (stockCheckError) {

    return { success: false, error: 'Could not verify product availability. Please try again.' }
  }

  const stockMap = new Map(products.map(p => [p.id, { stock: Number(p.stock ?? 0), name: p.name }]))
  const stockIssues = []

  for (const item of cartItems) {
    const info = stockMap.get(item.id)
    if (!info) {
      stockIssues.push({ name: item.name, requested: item.qty, available: 0, reason: 'Product not found' })
      continue
    }
    if (item.qty > info.stock) {
      stockIssues.push({ name: info.name, requested: item.qty, available: info.stock, reason: info.stock <= 0 ? 'Out of stock' : 'Insufficient stock' })
    }
  }

  if (stockIssues.length > 0) {
    const issueNames = stockIssues.map(i => i.name).join(', ')
    return {
      success: false,
      error: `Some items are out of stock or limited. Please update your cart. (${issueNames})`,
      stockIssues,
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id:     orderData.customerId || null,
      guest_name:      orderData.guestName || null,
      guest_email:     orderData.guestEmail || null,
      guest_phone:     orderData.guestPhone || null,
      delivery_name:   orderData.deliveryName,
      address_line1:   orderData.addressLine1,
      address_line2:   orderData.addressLine2 || null,
      city:            orderData.city,
      district:        orderData.district,
      country:         'Belize',
      delivery_notes:  orderData.deliveryNotes || null,
      shipping_method: normalizeShippingMethod(orderData.shippingMethod),
      shipping_cost:   orderData.shippingCost || 0,
      subtotal:        orderData.subtotal,
      total:           orderData.total,
      payment_method:  normalizePaymentMethod(orderData.paymentMethod),
      payment_status:  'unpaid',
    })
    .select()
    .single()

  if (orderError) {

    return { success: false, error: orderError.message }
  }

  const items = cartItems.map(item => ({
    order_id:      order.id,
    product_id:    item.id,
    product_name:  item.name,
    product_image: item.image,
    unit_price:    item.price,
    quantity:      item.qty,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items)

  if (itemsError) {

    return { success: false, error: itemsError.message }
  }

  for (const item of cartItems) {
    const info = stockMap.get(item.id)
    if (!info) continue

    const newStock = Math.max(0, info.stock - item.qty)
    const newStatus = newStock === 0 ? 'out' : newStock <= LOW_STOCK_THRESHOLD ? 'low' : 'active'

    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock: newStock, status: newStatus })
      .eq('id', item.id)

    if (updateErr) {
      console.warn(`Failed to update stock for product ${item.id}:`, updateErr.message)
    }
  }

  try {
    await sendOrderNotification({
      customer_name: orderData.deliveryName,
      product_name: cartItems.map(item => item.name).join(', '),
      quantity: cartItems.reduce((sum, item) => sum + item.qty, 0),
      order_id: order.id,
      total_price: orderData.total,
    })
  } catch (emailError) {

  }

  for (const item of cartItems) {
    try {
      const info = stockMap.get(item.id);
      if (!info) continue;
      const newStock = Math.max(0, info.stock - item.qty);
      if (newStock <= LOW_STOCK_THRESHOLD) {
        await sendLowStockAlert({
          product_name: info.name || item.name,
          stock_quantity: newStock,
          alert_level: `Stock is at ${newStock} units (threshold: ${LOW_STOCK_THRESHOLD}) after order ${order.id}`,
        });
      }
    } catch (emailError) {

    }
  }

  return { success: true, orderId: order.id }
  } catch (err) {

    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function fetchMyOrders(pageSize = 20) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    return []
  }

  try {

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_id, guest_name, guest_email, guest_phone, delivery_name, address_line1, address_line2, city, district, country, delivery_notes, shipping_method, shipping_cost, subtotal, total, payment_method, payment_status, status, created_at, updated_at')
      .eq('customer_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(pageSize)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return []
    }

    if (!orders || orders.length === 0) {
      return []
    }

    const orderIds = orders.map(o => o.id)
    const { data: allItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError)

      return orders
    }

    const itemsMap = new Map()
    allItems.forEach(item => {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, [])
      }
      itemsMap.get(item.order_id).push(item)
    })

    return orders.map(order => ({
      ...order,
      order_items: itemsMap.get(order.id) || []
    }))
  } catch (err) {
    console.error('Unexpected error fetching orders:', err)
    return []
  }
}

export async function fetchOrderById(orderId) {
  try {

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, guest_name, guest_email, guest_phone, delivery_name, address_line1, address_line2, city, district, country, delivery_notes, shipping_method, shipping_cost, subtotal, total, payment_method, payment_status, status, created_at, updated_at')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return null
    }

    if (!order) {
      return null
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError)

      return order
    }

    return {
      ...order,
      order_items: items || []
    }
  } catch (err) {
    console.error('Unexpected error fetching order:', err)
    return null
  }
}

export async function updatePaymentStatus(orderId, status) {

  const { data: previousOrder } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .single()

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment status:', error)
    return false
  }

  if (status === 'paid' && previousOrder?.payment_status !== 'paid') {
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          profiles ( first_name, last_name, email, phone ),
          order_items ( * )
        `)
        .eq('id', orderId)
        .single();

      if (fullOrder) {
        const customerName = fullOrder.profiles
          ? `${fullOrder.profiles.first_name || ''} ${fullOrder.profiles.last_name || ''}`.trim()
          : (fullOrder.guest_name || fullOrder.delivery_name || 'Guest');
        const customerEmail = fullOrder.profiles?.email || fullOrder.guest_email || '';

        if (customerEmail) {
          const items = fullOrder.order_items || [];

          const formatPrice = (val) => val ? `$${Number(val).toFixed(2)} BZD` : '';

          const orderData = {
            customer_name: customerName,
            customer_email: customerEmail,
            order_id: fullOrder.id,
            order_date: new Date(fullOrder.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            order_total: formatPrice(fullOrder.total),
            payment_method: fullOrder.payment_method || '',
            transaction_id: fullOrder.transaction_id || '',
            subtotal: formatPrice(fullOrder.subtotal),
            tax: formatPrice(fullOrder.tax),

            item_1_name: items[0]?.product_name || '',
            item_1_qty: items[0]?.quantity?.toString() || '',
            item_1_price: formatPrice(items[0]?.unit_price),
            item_1_total: items[0] ? formatPrice(items[0].unit_price * items[0].quantity) : '',

            item_2_name: items[1]?.product_name || '',
            item_2_qty: items[1]?.quantity?.toString() || '',
            item_2_price: formatPrice(items[1]?.unit_price),
            item_2_total: items[1] ? formatPrice(items[1].unit_price * items[1].quantity) : '',

            item_3_name: items[2]?.product_name || '',
            item_3_qty: items[2]?.quantity?.toString() || '',
            item_3_price: formatPrice(items[2]?.unit_price),
            item_3_total: items[2] ? formatPrice(items[2].unit_price * items[2].quantity) : '',
          };

          sendCustomerStatusEmail('paid', orderData).catch(err => {
            console.error("EmailJS Paid Email Error:", err);
          });
        }
      }
    } catch (e) {
      console.error("EmailJS Paid Email Error:", e);
    }
  }

  return true
}
