import { supabase } from './supabase.js'
import { sendLowStockAlert } from './emailNotification.js'
import { queryCache, CACHE_TTL } from './cache.middlware.js'
import { rateLimiter, RATE_LIMITS } from './ratellimit.middleware.js'

const LOW_STOCK_THRESHOLD = 6

export async function fetchProductsByCategory(categorySlug) {
  const cacheKey = queryCache.key('products_by_cat', categorySlug)

  return queryCache.get(cacheKey, async () => {
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
      description: p.description || '',
      category: categorySlug,
    }))
  }, { ttl: CACHE_TTL.PRODUCTS_BY_CAT })
}

export async function fetchCategories() {
  return queryCache.get('categories', async () => {
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
  }, { ttl: CACHE_TTL.CATEGORIES })
}

export async function fetchProductById(productId) {
  const cacheKey = queryCache.key('product', productId)

  return queryCache.get(cacheKey, async () => {
    // Fetch product data and images in parallel for faster load
    const [productResult, images] = await Promise.all([
      supabase
        .from('products')
        .select('*, categories(slug, name)')
        .eq('id', productId)
        .single(),
      fetchProductImages(productId),
    ])

    const { data, error } = productResult

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

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
      images:       images || [],
    }
  }, { ttl: CACHE_TTL.PRODUCT_DETAIL })
}

export async function fetchFeaturedProducts(limit = 5) {
  const cacheKey = queryCache.key('featured', limit)

  return queryCache.get(cacheKey, async () => {
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
  }, { ttl: CACHE_TTL.FEATURED })
}

export async function searchProducts(query) {
  if (!rateLimiter.allow('search', RATE_LIMITS.SEARCH)) {
    console.warn('Search rate limited — please wait')
    return []
  }

  const cacheKey = queryCache.key('search', query.toLowerCase().trim())

  return queryCache.get(cacheKey, async () => {
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
  }, { ttl: CACHE_TTL.SEARCH })
}

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
    description: p.description || '',
    category: p.categories?.slug,
    categoryId: p.categories?.id,
    categoryName: p.categories?.name,
  }))
}

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

  // Invalidate relevant caches so new product appears immediately
  queryCache.invalidatePrefix('products_by_cat')
  queryCache.invalidatePrefix('featured')
  queryCache.invalidate('categories')

  return { success: true, productId: data.id }
}

export async function updateProduct(productId, updates) {
  const updateData = {}
  let stockUpdated = false

  if (updates.name) updateData.name = updates.name
  if (updates.price !== undefined) updateData.price = Number(updates.price)
  if (updates.stock !== undefined) {
    updateData.stock = Number(updates.stock)
    stockUpdated = true

    updateData.status = Number(updates.stock) === 0 ? 'out' : Number(updates.stock) <= LOW_STOCK_THRESHOLD ? 'low' : 'active'
  }
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.tag !== undefined) updateData.tag = updates.tag || null
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url
  if (updates.category_id !== undefined) updateData.category_id = Number(updates.category_id)

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)

  if (error) {
    console.error('Error updating product:', error)
    return false
  }

  // Invalidate caches for updated product
  queryCache.invalidate(queryCache.key('product', productId))
  queryCache.invalidatePrefix('products_by_cat')
  queryCache.invalidatePrefix('featured')
  queryCache.invalidatePrefix('product_images:' + JSON.stringify(productId))

  if (stockUpdated && updateData.stock <= LOW_STOCK_THRESHOLD) {
    try {
      const product = await fetchProductById(productId)
      if (product) {
        await sendLowStockAlert({
          product_name: product.name,
          stock_quantity: product.stock,
          alert_level: `Stock is at ${product.stock} units (threshold: ${LOW_STOCK_THRESHOLD})`,
        })
      }
    } catch (emailError) {
      console.warn('Failed to send low stock alert:', emailError.message)
    }
  }

  return true
}

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

export async function uploadProductImage(file, fileName) {
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const random = Math.random().toString(36).substring(2, 6)
  const filePath = `${fileName || `product-${timestamp}-${random}`}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: false })

  if (error) {
    console.error('Error uploading image. Full error object:', error);
    return { success: false, error: error.message }
  }

  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return { success: true, url: publicUrl.publicUrl }
}

export async function fetchProductImages(productId) {
  const cacheKey = queryCache.key('product_images', productId)

  return queryCache.get(cacheKey, async () => {
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
  }, { ttl: CACHE_TTL.PRODUCT_IMAGES })
}

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

  const result = {}
  ;(data || []).forEach(img => {
    if (!result[img.product_id]) result[img.product_id] = []
    result[img.product_id].push(img)
  })

  return result
}

export async function addProductImage(productId, imageUrl, isPrimary = false) {

  if (isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
  }

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

  if (isPrimary) {
    await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)
  }

  return { success: true, imageId: data.id }
}

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

export async function setImageAsPrimary(productId, imageId) {

  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

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

  await supabase
    .from('products')
    .update({ image_url: data.image_url })
    .eq('id', productId)

  return true
}

export async function syncProductImages(productId, imageUrls) {

  await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (!imageUrls || imageUrls.length === 0) return true;

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

export async function uploadProductImageFiles(productId, files, onProgress = null) {
  const uploadedUrls = []
  const errors = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          fileName: file.name
        })
      }

      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = file.name.split('.').pop()
      const filename = `product_${productId}_${timestamp}_${random}.${ext}`
      const filePath = `product-images/${productId}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Batch image upload error. Full error object:', uploadError);
        errors.push(`${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)

      const isPrimary = i === 0
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

export async function deleteProductImageFile(storagePath, imageId) {
  try {

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([storagePath])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
      }
    }

    return await deleteProductImage(imageId)

  } catch (error) {
    console.error('Error deleting image file:', error)
    return false
  }
}
