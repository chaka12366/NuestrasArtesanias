import { supabase } from './supabase.js'
import { sendOrderNotification, sendLowStockAlert } from './emailNotification.js'

const LOW_STOCK_THRESHOLD = 6

// ──────────────────────────────────────────────────────────────
//  HELPER: Normalize shipping method labels to schema values
// ──────────────────────────────────────────────────────────────
function normalizeShippingMethod(label) {
  const labelToCode = {
    'Standard delivery': 'standard',
    'Express delivery': 'express',
    'Pick up in Corozal': 'pickup',
  }
  return labelToCode[label] || 'standard'
}

// ──────────────────────────────────────────────────────────────
//  HELPER: Normalize payment method labels to schema values
// ──────────────────────────────────────────────────────────────
function normalizePaymentMethod(label) {
  const labelToCode = {
    'Cash on delivery': 'cash_on_delivery',
    'Bank transfer': 'bank_transfer',
    'Card (coming soon)': 'card',
    'Card': 'card',
  }
  return labelToCode[label] || 'cash_on_delivery'
}

// ──────────────────────────────────────────────────────────────
//  ORDER SERVICE — Create, fetch, and manage orders
// ──────────────────────────────────────────────────────────────

/**
 * Place a new order and insert its line items.
 *
 * SAFETY: Before inserting, validates that sufficient stock exists
 * for every cart item. After inserting, decrements product stock
 * and updates product status accordingly.
 *
 * @param {Object} orderData  - Order header fields
 * @param {Array}  cartItems  - Array of cart items { id, name, image, price, qty }
 * @returns {Promise<{ success: boolean, orderId?: string, error?: string, stockIssues?: Array }>}
 */
export async function placeOrder(orderData, cartItems) {
  // ── 0 — Pre-flight: Validate stock for ALL items ──────────
  const productIds = cartItems.map(item => item.id)
  const { data: products, error: stockCheckError } = await supabase
    .from('products')
    .select('id, name, stock')
    .in('id', productIds)

  if (stockCheckError) {
    console.error('Stock check error:', stockCheckError)
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

  // ── 1 — Insert the order row ──────────────────────────────
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
    console.error('Order insert error:', orderError)
    return { success: false, error: orderError.message }
  }

  // ── 2 — Insert all order items (product info is snapshotted) ──
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
    console.error('Order items insert error:', itemsError)
    return { success: false, error: itemsError.message }
  }

  // ── 3 — Decrement stock & update product status ───────────
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

  // ── 4 — Send email notification to business owner ─────────
  try {
    await sendOrderNotification({
      customer_name: orderData.deliveryName,
      product_name: cartItems.map(item => item.name).join(', '),
      quantity: cartItems.reduce((sum, item) => sum + item.qty, 0),
      order_id: order.id,
      total_price: orderData.total,
    })
    console.log('Order notification email sent successfully')
  } catch (emailError) {
    // Log error but don't fail the order
    console.warn('Failed to send order notification email:', emailError.message)
  }

  // ── 5 — Check inventory levels and send low stock alerts ──
  // Reuse stockMap from preflight instead of N individual fetchProductById calls
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
        console.log(`Low stock alert sent for ${info.name || item.name} (stock: ${newStock})`);
      }
    } catch (emailError) {
      console.warn(`Failed to send low stock alert for ${item.name}:`, emailError.message);
    }
  }

  return { success: true, orderId: order.id }
}

/**
 * Fetch all orders for the currently logged-in customer.
 * RLS automatically scopes to their customer_id.
 * Uses pagination and separate queries to avoid Content-Length errors.
 *
 * @returns {Promise<Array>}
 */
export async function fetchMyOrders(pageSize = 20) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    return []
  }

  try {
    // Fetch orders with pagination to avoid large response bodies
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

    // Fetch order items in a separate query to avoid Content-Length issues
    const orderIds = orders.map(o => o.id)
    const { data: allItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError)
      // Return orders without items rather than failing completely
      return orders
    }

    // Map items back to their orders
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

/**
 * Fetch a single order by ID (with its line items).
 * @param {string} orderId  e.g. "NA-1001"
 * @returns {Promise<Object|null>}
 */
export async function fetchOrderById(orderId) {
  try {
    // Fetch order without nested items to avoid Content-Length errors
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

    // Fetch order items separately
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.warn('Error fetching order items:', itemsError)
      // Return order without items rather than failing completely
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

/**
 * Update the payment status of an order
 * @param {string} orderId 
 * @param {string} status 'paid' | 'unpaid'
 * @returns {Promise<boolean>}
 */
export async function updatePaymentStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment status:', error)
    return false
  }
  return true
}
