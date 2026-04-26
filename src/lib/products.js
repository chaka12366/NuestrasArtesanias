import { supabase } from './supabase.js'
import { sendLowStockAlert } from './emailNotification.js'

const LOW_STOCK_THRESHOLD = 6

// ──────────────────────────────────────────────────────────────
//  PRODUCT SERVICE — All product-related Supabase queries
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all active products for a given category slug.
 * Returns an array shaped like the old static data so the
 * existing UI components work without changes.
 *
 * @param {string} categorySlug  e.g. 'bracklets', 'anklets'
 * @returns {Promise<Array>}
 */
export async function fetchProductsByCategory(categorySlug) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories!inner(slug, name)')
    .eq('categories.slug', categorySlug)
    .eq('active', true)
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data.map(p => ({
    id:       p.id,
    name:     p.name,
    price:    Number(p.price),
    image:    p.image_url,
    tag:      p.tag || undefined,
    stock:    p.stock,
    status:   p.status,
    category: categorySlug,
  }))
}

/**
 * Fetch all active categories sorted by sort_order.
 * @returns {Promise<Array>}
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}

/**
 * Fetch a single product by its database ID with all images.
 * Used on the ProductDetail page.
 *
 * @param {number} productId
 * @returns {Promise<Object|null>}
 */
export async function fetchProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  // Fetch product images if they exist
  const images = await fetchProductImages(productId)

  return {
    id:           data.id,
    name:         data.name,
    price:        Number(data.price),
    image:        data.image_url,
    tag:          data.tag || undefined,
    stock:        data.stock,
    status:       data.status,
    description:  data.description,
    category:     data.categories?.slug,
    categoryName: data.categories?.name,
    images:       images || [],  // Array of image objects
  }
}

/**
 * Fetch featured products (those with a tag) for the homepage slider.
 * @param {number} limit  Number of products to return (default 5)
 * @returns {Promise<Array>}
 */
export async function fetchFeaturedProducts(limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('active', true)
    .not('tag', 'is', null)
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data.map(p => ({
    id:       p.id,
    image:    p.image_url,
    name:     p.name,
    price:    Number(p.price),
    category: p.categories?.slug,
  }))
}

/**
 * Search products by name (case-insensitive partial match).
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchProducts(query) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('active', true)
    .ilike('name', `%${query}%`)
    .order('sort_order')
    .limit(20)

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data.map(p => ({
    id:       p.id,
    name:     p.name,
    price:    Number(p.price),
    image:    p.image_url,
    tag:      p.tag || undefined,
    stock:    p.stock,
    category: p.categories?.slug,
  }))
}

// ──────────────────────────────────────────────────────────────
//  STOCK VALIDATION
// ──────────────────────────────────────────────────────────────

/**
 * Fetch current stock levels for a list of product IDs.
 * Used for cart and checkout validation to prevent overselling.
 *
 * @param {number[]} productIds  Array of product IDs to check
 * @returns {Promise<Map<number, { stock: number, name: string, status: string }>>}
 */
export async function checkStockForProducts(productIds) {
  if (!productIds.length) return new Map()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock, status')
    .in('id', productIds)

  if (error) {
    console.error('Error checking stock:', error)
    return new Map()
  }

  const stockMap = new Map()
  for (const p of data) {
    stockMap.set(p.id, {
      stock: Number(p.stock ?? 0),
      name: p.name,
      status: p.status,
    })
  }
  return stockMap
}

// ──────────────────────────────────────────────────────────────
//  ADMIN CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all products for admin dashboard (including inactive).
 * @returns {Promise<Array>}
 */
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, slug, name)')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all products:', error)
    return []
  }

  return data.map(p => ({
    id:       p.id,
    name:     p.name,
    price:    Number(p.price),
    image:    p.image_url,
    tag:      p.tag || undefined,
    stock:    Number(p.stock || 0),
    status:   p.status,
    active:   p.active,
    category: p.categories?.slug,
    categoryId: p.categories?.id,
    categoryName: p.categories?.name,
  }))
}

/**
 * Create a new product.
 * @param {Object} productData  { name, category_id, price, stock, description, image_url, tag }
 * @returns {Promise<{success: boolean, productId?: number, error?: string}>}
 */
export async function createProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: productData.name,
      category_id: Number(productData.category_id),
      price: Number(productData.price),
      stock: Number(productData.stock || 0),
      description: productData.description || '',
      image_url: productData.image_url || null,
      tag: productData.tag || null,
      active: true,
      status: Number(productData.stock || 0) === 0 ? 'out' : Number(productData.stock || 0) <= LOW_STOCK_THRESHOLD ? 'low' : 'active',
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { success: false, error: error.message }
  }

  return { success: true, productId: data.id }
}

/**
 * Update an existing product.
 * @param {number} productId
 * @param {Object} updates  { name?, price?, stock?, description?, tag?, image_url? }
 * @returns {Promise<boolean>}
 */
export async function updateProduct(productId, updates) {
  const updateData = {}
  let stockUpdated = false

  if (updates.name) updateData.name = updates.name
  if (updates.price !== undefined) updateData.price = Number(updates.price)
  if (updates.stock !== undefined) {
    updateData.stock = Number(updates.stock)
    stockUpdated = true
    // Auto-update status based on stock
    updateData.status = Number(updates.stock) === 0 ? 'out' : Number(updates.stock) <= LOW_STOCK_THRESHOLD ? 'low' : 'active'
  }
  if (updates.description) updateData.description = updates.description
  if (updates.tag !== undefined) updateData.tag = updates.tag || null
  if (updates.image_url) updateData.image_url = updates.image_url
  if (updates.category_id !== undefined) updateData.category_id = Number(updates.category_id)

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)

  if (error) {
    console.error('Error updating product:', error)
    return false
  }

  // Check and alert if stock is low
  if (stockUpdated && updateData.stock <= LOW_STOCK_THRESHOLD) {
    try {
      const product = await fetchProductById(productId)
      if (product) {
        await sendLowStockAlert({
          product_name: product.name,
          stock_quantity: product.stock,
          alert_level: `Stock is at ${product.stock} units (threshold: ${LOW_STOCK_THRESHOLD})`,
        })
        console.log(`Low stock alert sent for ${product.name}`)
      }
    } catch (emailError) {
      console.warn('Failed to send low stock alert:', emailError.message)
    }
  }

  return true
}

/**
 * Delete a product (soft delete - set active to false).
 * @param {number} productId
 * @returns {Promise<boolean>}
 */
export async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .update({ active: false })
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

/**
 * Upload a product image to Supabase storage.
 * @param {File} file  The image file to upload
 * @param {string} fileName  Optional custom filename
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadProductImage(file, fileName) {
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const random = Math.random().toString(36).substring(2, 6)
  const filePath = `${fileName || `product-${timestamp}-${random}`}.${fileExt}`

  console.log('--- SUPABASE UPLOAD DEBUG ---');
  console.log('Project URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Bucket Name: product-images');
  console.log('File Path:', filePath);
  console.log('File Object:', file);

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: false })

  if (error) {
    console.error('Error uploading image. Full error object:', error);
    return { success: false, error: error.message }
  }

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return { success: true, url: publicUrl.publicUrl }
}

// ──────────────────────────────────────────────────────────────
//  MULTIPLE PRODUCT IMAGES MANAGEMENT
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all images for a product
 * @param {number} productId
 * @returns {Promise<Array>}
 */
export async function fetchProductImages(productId) {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching product images:', error)
    return []
  }

  return data || []
}

/**
 * Batch fetch images for multiple products (avoids N+1 queries)
 * @param {number[]} productIds Array of product IDs
 * @returns {Promise<Object>} Object with keys: { productId: [images] }
 */
export async function fetchProductImagesBatch(productIds) {
  if (!productIds || productIds.length === 0) return {}

  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching batch product images:', error)
    return {}
  }

  // Group images by product_id
  const result = {}
  ;(data || []).forEach(img => {
    if (!result[img.product_id]) result[img.product_id] = []
    result[img.product_id].push(img)
  })

  return result
}

/**
 * Add a new image to a product
 * @param {number} productId
 * @param {string} imageUrl
 * @param {boolean} isPrimary  Whether to set as primary/thumbnail
 * @returns {Promise<{success: boolean, imageId?: number, error?: string}>}
 */
export async function addProductImage(productId, imageUrl, isPrimary = false) {
  // If this is the primary, unset other primary images
  if (isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
  }

  // Get the next display order
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existingImages?.[0]?.display_order ?? -1) + 1

  const { data, error } = await supabase
    .from('product_images')
    .insert([{
      product_id: productId,
      image_url: imageUrl,
      is_primary: isPrimary,
      display_order: nextOrder,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error adding image:', error)
    return { success: false, error: error.message }
  }

  // Update primary image_url in products table if this is primary
  if (isPrimary) {
    await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)
  }

  return { success: true, imageId: data.id }
}

/**
 * Delete a product image
 * @param {number} imageId
 * @returns {Promise<boolean>}
 */
export async function deleteProductImage(imageId) {
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    console.error('Error deleting image:', error)
    return false
  }

  return true
}

/**
 * Reorder product images (drag-and-drop)
 * @param {number} productId
 * @param {Array} imageIds  Array of image IDs in new order
 * @returns {Promise<boolean>}
 */
export async function reorderProductImages(productId, imageIds) {
  const updates = imageIds.map((id, index) => ({
    id,
    product_id: productId,
    display_order: index,
  }))

  const { error } = await supabase
    .from('product_images')
    .upsert(updates)

  if (error) {
    console.error('Error reordering images:', error)
    return false
  }

  return true
}

/**
 * Set an image as primary (thumbnail)
 * @param {number} productId
 * @param {number} imageId
 * @returns {Promise<boolean>}
 */
export async function setImageAsPrimary(productId, imageId) {
  // Unset other primary images
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  // Set the new primary
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .select('image_url')
    .single()

  if (error) {
    console.error('Error setting primary image:', error)
    return false
  }

  // Update the primary image in products table
  await supabase
    .from('products')
    .update({ image_url: data.image_url })
    .eq('id', productId)

  return true
}

/**
 * Sync product images (replaces all existing images for a product)
 * @param {number} productId 
 * @param {string[]} imageUrls 
 * @returns {Promise<boolean>}
 */
export async function syncProductImages(productId, imageUrls) {
  // Delete all existing images
  await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (!imageUrls || imageUrls.length === 0) return true;

  // Insert new images
  const inserts = imageUrls.map((url, i) => ({
    product_id: productId,
    image_url: url,
    is_primary: i === 0,
    display_order: i,
  }));

  const { error } = await supabase
    .from('product_images')
    .insert(inserts);

  if (error) {
    console.error('Error syncing images:', error);
    return false;
  }

  return true;
}

// ──────────────────────────────────────────────────────────────
//  BATCH IMAGE UPLOAD FOR MULTI-IMAGE UPLOAD COMPONENT
// ──────────────────────────────────────────────────────────────

/**
 * Upload multiple image files for a product (from MultiImageUpload component)
 * 
 * @param {number} productId  Product ID to attach images to
 * @param {File[]} files  Array of File objects from input
 * @param {Function} onProgress  Optional callback for progress tracking
 *                               Receives: { current: number, total: number, fileName: string }
 * @returns {Promise<{success: boolean, urls?: string[], errors?: string[]}>}
 */
export async function uploadProductImageFiles(productId, files, onProgress = null) {
  const uploadedUrls = []
  const errors = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Notify progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          fileName: file.name
        })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = file.name.split('.').pop()
      const filename = `product_${productId}_${timestamp}_${random}.${ext}`
      const filePath = `product-images/${productId}/${filename}`

      console.log('--- SUPABASE BATCH UPLOAD DEBUG ---');
      console.log('Project URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Bucket Name: product-images');
      console.log('File Path:', filePath);
      console.log('File Object:', file);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Batch image upload error. Full error object:', uploadError);
        errors.push(`${file.name}: ${uploadError.message}`)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)

      const isPrimary = i === 0 // First image is primary
      const { error: dbError } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          image_url: publicUrl,
          is_primary: isPrimary,
          display_order: i,
          storage_path: filePath
        }])

      if (dbError) {
        errors.push(`${file.name} saved to storage but database error: ${dbError.message}`)
        continue
      }

      // Update product thumbnail if this is first image
      if (isPrimary) {
        await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', productId)
      }
    }

    return {
      success: errors.length === 0,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error) {
    console.error('Batch image upload error:', error)
    return {
      success: false,
      urls: uploadedUrls,
      errors: [error.message]
    }
  }
}

/**
 * Delete a product image from Supabase storage (cleanup)
 * @param {string} storagePath  Path in storage (e.g., 'product-images/123/file.jpg')
 * @param {number} imageId  Image record ID in database
 * @returns {Promise<boolean>}
 */
export async function deleteProductImageFile(storagePath, imageId) {
  try {
    // Delete from storage
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([storagePath])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
      }
    }

    // Delete from database
    return await deleteProductImage(imageId)

  } catch (error) {
    console.error('Error deleting image file:', error)
    return false
  }
}
