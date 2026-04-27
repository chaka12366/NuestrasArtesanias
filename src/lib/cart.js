import { supabase } from './supabase.js'

// ──────────────────────────────────────────────────────────────
//  CART SERVICE — Persistent cart for logged-in users
//  Guest carts stay in React state / localStorage and are
//  migrated to the database when the user logs in.
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all cart items for the logged-in user.
 * Joins product + category data so the UI has everything it needs.
 *
 * @returns {Promise<Array>}
 */
export async function fetchCart() {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(id, name, price, image_url, stock, categories(slug))')
    .order('added_at')

  if (error) {
    console.error('Error fetching cart:', error)
    return []
  }

  return data
    .filter(item => item.products != null)
    .map(item => ({
      id:         item.product_id,
      key:        `${item.products.categories?.slug || 'unknown'}-${item.product_id}`,
      name:       item.products.name,
      price:      Number(item.products.price),
      image:      item.products.image_url,
      stock:      item.products.stock,
      category:   item.products.categories?.slug,
      qty:        item.quantity,
      cartItemId: item.id,
    }))
}

/**
 * Add a product to the cart (or update quantity if it already exists).
 * Uses upsert on the unique (customer_id, product_id) constraint.
 *
 * @param {number} productId
 * @param {number} quantity
 */
export async function addCartItem(productId, quantity = 1) {
  // Get current user id for the upsert
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      {
        customer_id: user.id,
        product_id:  productId,
        quantity:    quantity,
      },
      { onConflict: 'customer_id,product_id' }
    )

  if (error) console.error('Error adding to cart:', error)
}

/**
 * Update the quantity of an existing cart item.
 *
 * @param {number} productId
 * @param {number} quantity   New quantity (1–99)
 */
export async function updateCartItem(productId, quantity) {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('product_id', productId)

  if (error) console.error('Error updating cart item:', error)
}

/**
 * Remove a single product from the cart.
 * @param {number} productId
 */
export async function removeCartItem(productId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('product_id', productId)

  if (error) console.error('Error removing cart item:', error)
}

/**
 * Clear the entire cart for the logged-in user.
 * RLS ensures only the current user's rows are deleted.
 */
export async function clearCartItems() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', user.id)

  if (error) console.error('Error clearing cart:', error)
}

/**
 * Migrate a guest cart (from React state) into the database
 * after the user logs in. Inserts all items, skipping conflicts.
 *
 * @param {Array} guestItems  Array of { id (product_id), qty }
 */
export async function migrateGuestCart(guestItems) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !guestItems.length) return

  const rows = guestItems.map(item => ({
    customer_id: user.id,
    product_id:  item.id,
    quantity:    item.qty,
  }))

  const { error } = await supabase
    .from('cart_items')
    .upsert(rows, { onConflict: 'customer_id,product_id' })

  if (error) console.error('Error migrating guest cart:', error)
}
