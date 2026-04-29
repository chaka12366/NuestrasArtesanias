import { supabase } from './supabase.js'

// ──────────────────────────────────────────────────────────────
//  DASHBOARD SERVICE — Queries for the owner admin dashboard
//  These call the SQL views defined in supabase.sql
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all dashboard statistics in a single batch.
 * Runs 5 queries in parallel for speed.
 *
 * @returns {Promise<Object>}
 */
export async function fetchDashboardStats() {
  try {
    const [revenue, statusSummary, topProducts, customerStats, lowStock] =
      await Promise.all([
        supabase.from('monthly_revenue').select('*'),
        supabase.from('order_status_summary').select('*'),
        supabase.from('top_products').select('*').limit(10),
        supabase.from('customer_stats').select('*').single(),
        supabase.from('low_stock_alerts').select('*'),
      ])

    return {
      monthlyRevenue: revenue.data || [],
      orderStatus:    statusSummary.data || [],
      topProducts:    topProducts.data || [],
      customerStats:  customerStats.data || { total_customers: 0, new_this_month: 0 },
      lowStockAlerts: lowStock.data || [],
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
    return {
      monthlyRevenue: [],
      orderStatus:    [],
      topProducts:    [],
      customerStats:  { total_customers: 0, new_this_month: 0 },
      lowStockAlerts: [],
    }
  }
}

/**
 * Fetch revenue broken down by category.
 * @returns {Promise<Array>}
 */
export async function fetchRevenueByCategory() {
  const { data, error } = await supabase
    .from('revenue_by_category')
    .select('*')

  if (error) {
    console.error('Error fetching revenue by category:', error)
    return []
  }
  return data
}

/**
 * Fetch all orders with customer info (owner view).
 * @returns {Promise<Array>}
 */
export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles(first_name, last_name, email, phone)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all orders:', error)
    return []
  }
  return data
}

/**
 * Update an order's status (owner only).
 * @param {string} orderId   e.g. "NA-1001"
 * @param {string} newStatus 'pending' | 'in-progress' | 'ready' | 'delivered' | 'cancelled'
 * @returns {Promise<boolean>}
 */
export async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }
  return true
}

/**
 * Update an order's payment status (owner only).
 * @param {string} orderId
 * @param {string} newStatus 'unpaid' | 'paid' | 'refunded'
 * @returns {Promise<boolean>}
 */
export async function updatePaymentStatus(orderId, newStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment status:', error)
    return false
  }
  return true
}

/**
 * Restore product stock when an order is cancelled.
 * Fetches all items from the order and adds their quantities back to products.
 *
 * SAFETY: Only restores if order is not already cancelled (idempotent).
 *
 * @param {string} orderId  e.g. "NA-1001"
 * @returns {Promise<{ success: boolean, message: string, restoredCount?: number }>}
 */
export async function restoreStock(orderId) {
  try {
    // Fetch the order to check current status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { success: false, message: 'Could not fetch order' }
    }

    // If already cancelled, don't restore stock again (idempotent)
    if (order.status === 'cancelled') {
      return { success: true, message: 'Order already cancelled. Stock restore skipped.', restoredCount: 0 }
    }

    // Fetch only ACTIVE items in this order (skip already-cancelled ones
    // whose stock was already restored by cancelOrderItem)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, status')
      .eq('order_id', orderId)
      .neq('status', 'cancelled')

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return { success: false, message: 'Could not fetch order items' }
    }

    if (!orderItems || orderItems.length === 0) {
      return { success: true, message: 'No items to restore', restoredCount: 0 }
    }

    // Restore stock for each product
    let restoredCount = 0
    const errors = []

    for (const item of orderItems) {
      // Fetch current product stock
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()

      if (prodError) {
        console.error(`Error fetching product ${item.product_id}:`, prodError)
        errors.push(`Product ${item.product_id}: ${prodError.message}`)
        continue
      }

      const newStock = (Number(product.stock) || 0) + item.quantity
      const newStatus = newStock === 0 ? 'out' : newStock <= 6 ? 'low' : 'active'

      // Update product stock and status
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock, status: newStatus })
        .eq('id', item.product_id)

      if (updateError) {
        console.error(`Error updating product ${item.product_id}:`, updateError)
        errors.push(`Product ${item.product_id}: ${updateError.message}`)
        continue
      }

      restoredCount++
    }

    // If all items restored successfully
    if (errors.length === 0) {
      return {
        success: true,
        message: `Stock restored for ${restoredCount} product${restoredCount !== 1 ? 's' : ''}`,
        restoredCount,
      }
    }

    // Partial success
    return {
      success: false,
      message: `Partial restore: ${restoredCount} products restored, ${errors.length} failed. ${errors.join('; ')}`,
      restoredCount,
    }
  } catch (err) {
    console.error('Error in restoreStock:', err)
    return { success: false, message: `Error: ${err.message}` }
  }
}

/**
 * Cancel an order and restore its product stock.
 *
 * FLOW:
 * 1. Check if order is already cancelled (prevent double-cancellation)
 * 2. Restore all product stock from order items
 * 3. Update order status to 'cancelled'
 * 4. Return success/error details
 *
 * @param {string} orderId  e.g. "NA-1001"
 * @returns {Promise<{ success: boolean, message: string, orderCancelled?: boolean, stockRestored?: boolean }>}
 */
export async function cancelOrder(orderId) {
  try {
    // Check current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { success: false, message: 'Could not fetch order', orderCancelled: false }
    }

    // Prevent double-cancellation
    if (order.status === 'cancelled') {
      return {
        success: false,
        message: 'Order is already cancelled',
        orderCancelled: false,
        stockRestored: false,
      }
    }

    // Restore stock first
    const stockResult = await restoreStock(orderId)
    if (!stockResult.success) {
      console.warn('Stock restore had issues:', stockResult.message)
      // Continue anyway, as we still want to mark order as cancelled
    }

    // Update order status to cancelled
    const { error: cancelError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (cancelError) {
      console.error('Error cancelling order:', cancelError)
      return {
        success: false,
        message: `Failed to cancel order: ${cancelError.message}`,
        orderCancelled: false,
        stockRestored: stockResult.success,
      }
    }

    return {
      success: true,
      message: `Order ${orderId} cancelled successfully. ${stockResult.message}`,
      orderCancelled: true,
      stockRestored: stockResult.success,
      restoredItems: stockResult.restoredCount,
    }
  } catch (err) {
    console.error('Error in cancelOrder:', err)
    return {
      success: false,
      message: `Error: ${err.message}`,
      orderCancelled: false,
      stockRestored: false,
    }
  }
}

/**
 * Cancel a SINGLE item inside an order and restore its stock.
 *
 * FLOW:
 * 1. Check if item is already cancelled (prevent double-cancel)
 * 2. Set order_items.status = 'cancelled'
 * 3. Restore product stock for that item's quantity
 *
 * @param {number} itemId      - order_items.id
 * @param {number} productId   - products.id
 * @param {number} quantity    - quantity to restore
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function cancelOrderItem(itemId, productId, quantityToCancel) {
  try {
    // 1. Fetch current item info
    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError) {
      console.error('Error fetching order item:', itemError)
      return { success: false, message: 'Could not fetch item' }
    }

    if (item.status === 'cancelled') {
      return { success: false, message: 'Item is already cancelled' }
    }

    if (quantityToCancel <= 0 || quantityToCancel > item.quantity) {
      return { success: false, message: 'Invalid quantity to cancel' }
    }

    let allCancelled = false;
    let newCancelledItemSubtotal = item.unit_price * quantityToCancel;
    let newCancelledItem = null;
    let updatedActiveItem = null;

    if (quantityToCancel === item.quantity) {
      // Cancel the entire row
      const { data, error: updateError } = await supabase
        .from('order_items')
        .update({ status: 'cancelled' })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        return { success: false, message: updateError.message };
      }
      newCancelledItem = data;
    } else {
      // Partial cancellation:
      // 1. Reduce quantity of existing item
      const newActiveQuantity = item.quantity - quantityToCancel;
      const newActiveSubtotal = item.unit_price * newActiveQuantity;
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('order_items')
        .update({ quantity: newActiveQuantity, subtotal: newActiveSubtotal })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        return { success: false, message: updateError.message };
      }
      updatedActiveItem = updatedItem;

      // 2. Insert a new cancelled item row for the cancelled portion
      const { data: insertedItem, error: insertError } = await supabase
        .from('order_items')
        .insert({
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          unit_price: item.unit_price,
          quantity: quantityToCancel,
          subtotal: newCancelledItemSubtotal,
          status: 'cancelled'
        })
        .select()
        .single();

      if (insertError) {
         console.error('Error creating cancelled order item:', insertError);
      } else {
         newCancelledItem = insertedItem;
      }
    }

    // Update parent order total
    const { data: orderData } = await supabase
      .from('orders')
      .select('total')
      .eq('id', item.order_id)
      .single();

    if (orderData) {
      const newTotal = Math.max(0, (Number(orderData.total) || 0) - (Number(newCancelledItemSubtotal) || 0));
      await supabase
        .from('orders')
        .update({ total: newTotal })
        .eq('id', item.order_id);
    }

    // 3. Restore stock for this product
    if (productId) {
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single()

      if (!prodError && product) {
        const newStock = (Number(product.stock) || 0) + quantityToCancel;
        const newStatus = newStock === 0 ? 'out' : newStock <= 6 ? 'low' : 'active';

        await supabase
          .from('products')
          .update({ stock: newStock, status: newStatus })
          .eq('id', productId)
      }
    }

    // 4. Check if ALL items in the order are now cancelled → auto-cancel order
    const { data: siblingItems, error: siblingsError } = await supabase
      .from('order_items')
      .select('id, status')
      .eq('order_id', item.order_id)

    if (!siblingsError && siblingItems) {
      allCancelled = siblingItems.every(si => si.status === 'cancelled')
      if (allCancelled) {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', item.order_id)
      }
    }

    return { 
      success: true, 
      message: 'Item cancelled and stock restored', 
      allCancelled,
      updatedActiveItem,
      newCancelledItem
    }
  } catch (err) {
    console.error('Error in cancelOrderItem:', err)
    return { success: false, message: err.message }
  }
}

// ──────────────────────────────────────────────────────────────
//  NOTIFICATIONS
// ──────────────────────────────────────────────────────────────

/**
 * Fetch recent notifications for the owner.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchNotifications(limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data
}

/**
 * Get the count of unread notifications.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  if (error) {
    console.error('Error counting unread:', error)
    return 0
  }
  return count || 0
}

/**
 * Mark a single notification as read.
 * @param {number} notificationId
 */
export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) console.error('Error marking notification read:', error)
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)

  if (error) console.error('Error marking all read:', error)
}

// ──────────────────────────────────────────────────────────────
//  INVENTORY MANAGEMENT
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all inventory items (raw materials / supplies).
 * @returns {Promise<Array>}
 */
export async function fetchInventory() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
  return data
}

/**
 * Add a new inventory item.
 * @param {Object} item
 * @returns {Promise<Object|null>}
 */
export async function addInventoryItem(item) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Error adding inventory item:', error)
    return null
  }
  return data
}

/**
 * Update an inventory item's quantity or details.
 * @param {number} itemId
 * @param {Object} updates
 * @returns {Promise<boolean>}
 */
export async function updateInventoryItem(itemId, updates) {
  const { error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', itemId)

  if (error) {
    console.error('Error updating inventory item:', error)
    return false
  }
  return true
}

// ──────────────────────────────────────────────────────────────
//  PRODUCT MANAGEMENT (owner CRUD)
// ──────────────────────────────────────────────────────────────

/**
 * Fetch ALL products including inactive (owner view).
 * @returns {Promise<Array>}
 */
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .order('category_id')
    .order('sort_order')

  if (error) {
    console.error('Error fetching all products:', error)
    return []
  }
  return data
}

/**
 * Add a new product.
 * @param {Object} product
 * @returns {Promise<Object|null>}
 */
export async function addProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error adding product:', error)
    return null
  }
  return data
}

/**
 * Update a product.
 * @param {number} productId
 * @param {Object} updates
 * @returns {Promise<boolean>}
 */
export async function updateProduct(productId, updates) {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)

  if (error) {
    console.error('Error updating product:', error)
    return false
  }
  return true
}

// ──────────────────────────────────────────────────────────────
//  STORE SETTINGS
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all store settings.
 * Returns settings parsed from the key-value store.
 * @returns {Promise<Object|null>}
 */
export async function fetchStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value')

  const defaults = {
    name: 'Nuestras Artesanías',
    email: 'nuestrasartesanias@gmail.com',
    phone: '+501 600-0000',
    whatsapp: '+501-555-0000',
    instagram: '@_nuestrasartesanias_',
    address: 'Corozal Town, Belize',
    currency: 'BZD',
    tagline: 'Handcrafted & Authentic',
    shipping_zones: 'Countrywide',
    theme: 'warm',
    cardStyle: 'rounded',
    showTopbar: 'true',
    showRatings: 'true',
  };

  if (error || !data || data.length === 0) {
    if (error) console.error('Error fetching store settings:', error);
    return defaults;
  }

  const settings = { ...defaults };
  data.forEach(row => {
    settings[row.key] = row.value;
  });
  
  return settings;
}

/**
 * Update all store settings.
 * Upserts key-value pairs into the store_settings table.
 * @param {Object} settings - All settings fields
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateStoreSettings(settings) {
  // Convert object to array of { key, value }
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value?.toString() || ""
  }));

  const { error } = await supabase
    .from('store_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) {
    console.error('Error updating store settings:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}
