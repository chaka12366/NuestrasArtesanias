import { supabase } from './supabase.js'

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

export async function addCartItem(productId, quantity = 1) {

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

export async function updateCartItem(productId, quantity) {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('product_id', productId)

  if (error) console.error('Error updating cart item:', error)
}

export async function removeCartItem(productId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('product_id', productId)

  if (error) console.error('Error removing cart item:', error)
}

export async function clearCartItems() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', user.id)

  if (error) console.error('Error clearing cart:', error)
}

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
