import { supabase } from './supabase.js'
import { queryCache } from './cache.middlware.js'

// Dashboard-specific cache TTLs
const DASH_TTL = {
  STATS:       2 * 60 * 1000,  // 2 min — aggregated views
  ORDERS:      1 * 60 * 1000,  // 1 min — needs to be relatively fresh
  REVENUE_CAT: 3 * 60 * 1000,  // 3 min — slow to change
  NOTIFY:      1 * 60 * 1000,  // 1 min
  PRODUCTS:    2 * 60 * 1000,  // 2 min
}

export async function fetchDashboardStats() {
  return queryCache.get('dashboard_stats', async () => {
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
  }, { ttl: DASH_TTL.STATS })
}

export async function fetchRevenueByCategory() {
  return queryCache.get('revenue_by_category', async () => {
    const { data, error } = await supabase
      .from('revenue_by_category')
      .select('*')

    if (error) {
      console.error('Error fetching revenue by category:', error)
      return []
    }
    return data
  }, { ttl: DASH_TTL.REVENUE_CAT })
}

export async function fetchAllOrders() {
  return queryCache.get('all_orders', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), profiles(first_name, last_name, email, phone)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all orders:', error)
      return []
    }
    return data
  }, { ttl: DASH_TTL.ORDERS })
}

export async function updateOrderStatus(orderId, newStatus) {
  try {

    if (newStatus === 'delivered') {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()

      if (fetchError) {
        console.error('Error checking payment status:', fetchError)
        return false
      }

      if (order.payment_status !== 'paid') {
        return { blocked: true, message: 'Order must be paid before delivery' }
      }
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return false
    }
    // Invalidate order-related caches
    queryCache.invalidate('all_orders')
    queryCache.invalidate('dashboard_stats')
    return true
  } catch (err) {
    console.error('Error in updateOrderStatus:', err)
    return false
  }
}

export async function updatePaymentStatus(orderId, newStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment status:', error)
    return false
  }
  queryCache.invalidate('all_orders')
  queryCache.invalidate('dashboard_stats')
  return true
}

export async function restoreStock(orderId) {
  try {

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { success: false, message: 'Could not fetch order' }
    }

    if (order.status === 'cancelled') {
      return { success: true, message: 'Order already cancelled. Stock restore skipped.', restoredCount: 0 }
    }

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

    let restoredCount = 0
    const errors = []

    for (const item of orderItems) {

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

    if (errors.length === 0) {
      return {
        success: true,
        message: `Stock restored for ${restoredCount} product${restoredCount !== 1 ? 's' : ''}`,
        restoredCount,
      }
    }

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

export async function cancelOrder(orderId) {
  try {

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { success: false, message: 'Could not fetch order', orderCancelled: false }
    }

    if (order.status === 'cancelled') {
      return {
        success: false,
        message: 'Order is already cancelled',
        orderCancelled: false,
        stockRestored: false,
      }
    }

    const stockResult = await restoreStock(orderId)
    if (!stockResult.success) {
      console.warn('Stock restore had issues:', stockResult.message)

    }

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
  } finally {
    // Always invalidate caches after cancel attempt
    queryCache.invalidate('all_orders')
    queryCache.invalidate('dashboard_stats')
    queryCache.invalidatePrefix('products_by_cat')
  }
}

export async function cancelOrderItem(itemId, productId, quantityToCancel) {
  try {

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

export async function fetchNotifications(limit = 20) {
  const cacheKey = queryCache.key('notifications', limit)
  return queryCache.get(cacheKey, async () => {
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
  }, { ttl: DASH_TTL.NOTIFY })
}

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

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) console.error('Error marking notification read:', error)
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)

  if (error) console.error('Error marking all read:', error)
}

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

export async function fetchAllProducts() {
  return queryCache.get('admin_all_products', async () => {
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
  }, { ttl: DASH_TTL.PRODUCTS })
}

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

export async function updateStoreSettings(settings) {

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
