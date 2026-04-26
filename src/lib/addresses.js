import { supabase } from './supabase.js'

export async function fetchMyAddresses() {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) { console.error('Error fetching addresses:', error); return [] }
  return data
}

export async function addAddress(address) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      customer_id: user.id,
      label: address.label || 'Home',
      full_name: address.fullName,
      address_line1: address.addressLine1,
      address_line2: address.addressLine2 || null,
      city: address.city,
      district: address.district,
      country: address.country || 'Belize',
      is_default: address.isDefault || false,
    })
    .select().single()
  if (error) { console.error('Error adding address:', error); return null }
  return data
}

export async function updateAddress(addressId, updates) {
  const { error } = await supabase.from('addresses').update(updates).eq('id', addressId)
  if (error) { console.error('Error updating address:', error); return false }
  return true
}

export async function deleteAddress(addressId) {
  const { error } = await supabase.from('addresses').delete().eq('id', addressId)
  if (error) { console.error('Error deleting address:', error); return false }
  return true
}

export async function setDefaultAddress(addressId) {
  return updateAddress(addressId, { is_default: true })
}
