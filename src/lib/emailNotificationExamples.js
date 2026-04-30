

import { sendOrderNotification } from '../lib/emailNotification';
import { supabase } from '../lib/supabase';

export const createOrderWithNotification = async (orderData) => {
  try {

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          product_name: orderData.productName,
          quantity: orderData.quantity,
          total_price: orderData.totalPrice,
          order_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Order created successfully:', data);

    try {
      await sendOrderNotification({
        customer_name: data.customer_name,
        product_name: data.product_name,
        quantity: data.quantity,
        order_id: data.id,
        total_price: data.total_price,
      });
      console.log('Order notification email sent');
    } catch (emailError) {

      console.error('Failed to send order notification:', emailError.message);
    }

    return data;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw error;
  }
};

import { sendLowStockAlert } from '../lib/emailNotification';

const LOW_STOCK_THRESHOLD = 10;

export const checkAndAlertLowStock = async (productId) => {
  try {

    const { data, error } = await supabase
      .from('products')
      .select('id, product_name, stock_quantity')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (data.stock_quantity < LOW_STOCK_THRESHOLD) {
      console.log(`Low stock detected for ${data.product_name}`);

      try {
        await sendLowStockAlert({
          product_name: data.product_name,
          stock_quantity: data.stock_quantity,
          alert_level: `Stock is below ${LOW_STOCK_THRESHOLD} units`,
        });
        console.log('Low stock alert email sent');
      } catch (emailError) {
        console.error('Failed to send low stock alert:', emailError.message);
      }
    }

    return data;
  } catch (error) {
    console.error('Error checking stock level:', error.message);
    throw error;
  }
};

export const processOrderAndCheckStock = async (orderData, productId) => {
  try {

    const newOrder = await createOrderWithNotification(orderData);

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = product.stock_quantity - orderData.quantity;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', productId);

    if (updateError) throw updateError;

    await checkAndAlertLowStock(productId);

    return newOrder;
  } catch (error) {
    console.error('Error processing order:', error.message);
    throw error;
  }
};

import React, { useState } from 'react';

export const OrderSubmitExample = () => {
  const [loading, setLoading] = useState(false);

  const handleOrderSubmit = async (formData) => {
    setLoading(true);
    try {
      await createOrderWithNotification({
        customerName: formData.name,
        customerEmail: formData.email,
        productName: formData.product,
        quantity: formData.quantity,
        totalPrice: formData.totalPrice,
      });

      alert('Order placed successfully! Business owner will be notified.');
    } catch (error) {
      alert('Error creating order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleOrderSubmit()} disabled={loading}>
      {loading ? 'Processing...' : 'Place Order'}
    </button>
  );
};
