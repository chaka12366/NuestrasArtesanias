import { useCart } from "../contexts/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Truck, Lock, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchProductImagesBatch } from "../lib/products.js";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState.jsx";
import "./CartPage.css";

/* ── Swipeable Image Gallery ── */
function CartItemGallery({ item, images, loading }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const dragStartX = useRef(null);

  const allImages = images && images.length > 0
    ? images.map(img => img.image_url)
    : (item.image ? [item.image] : []);

  const total = allImages.length;

  const go = (dir) => {
    setDirection(dir);
    setIndex(i => (i + dir + total) % total);
  };

  const resolveUrl = (url) => {
    if (!url) return '/logo.png';
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('//')) return url;
    return `/${url}`;
  };

  const variants = {
    enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  if (loading) {
    return (
      <div className="cg-root">
        <div className="cg-img-wrap cg-loading">
          <div className="cg-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="cg-root">
      {/* Main image with swipe */}
      <div
        className="cg-img-wrap"
        onPointerDown={e => { dragStartX.current = e.clientX; }}
        onPointerUp={e => {
          if (dragStartX.current === null || total <= 1) return;
          const diff = e.clientX - dragStartX.current;
          if (Math.abs(diff) > 40) go(diff < 0 ? 1 : -1);
          dragStartX.current = null;
        }}
      >
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.img
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            src={resolveUrl(allImages[index])}
            alt={item.name}
            className="cg-img"
            draggable={false}
            onError={e => { e.target.src = '/logo.png'; }}
          />
        </AnimatePresence>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button className="cg-btn cg-btn-left" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={14} />
            </button>
            <button className="cg-btn cg-btn-right" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={14} />
            </button>
            <div className="cg-counter">{index + 1} / {total}</div>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="cg-dots">
          {allImages.map((_, i) => (
            <button
              key={i}
              className={`cg-dot${i === index ? ' active' : ''}`}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="cg-thumbs">
          {allImages.map((url, i) => (
            <button
              key={i}
              className={`cg-thumb${i === index ? ' active' : ''}`}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
              aria-label={`View image ${i + 1}`}
            >
              <img src={resolveUrl(url)} alt={`${item.name} ${i + 1}`} onError={e => { e.target.src = '/logo.png'; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, itemCount, total, updateQty, removeFromCart, clearCart } = useCart();
  const [productImages, setProductImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const fetchedIdsRef = useRef(new Set());

  useEffect(() => {
    const idsToFetch = items
      .filter(item => item.id && !fetchedIdsRef.current.has(item.id))
      .map(item => item.id);

    if (idsToFetch.length === 0) return;

    // Mark as fetching immediately to prevent duplicate requests
    idsToFetch.forEach(id => {
      fetchedIdsRef.current.add(id);
      setLoadingImages(prev => ({ ...prev, [id]: true }));
    });

    // Batch fetch all images in ONE query instead of N individual queries
    fetchProductImagesBatch(idsToFetch)
      .then(batchedImages => {
        setProductImages(prev => ({ ...prev, ...batchedImages }));
        idsToFetch.forEach(id => {
          setLoadingImages(prev => ({ ...prev, [id]: false }));
        });
      })
      .catch(err => {
        console.error('Error fetching batch images:', err);
        idsToFetch.forEach(id => {
          setLoadingImages(prev => ({ ...prev, [id]: false }));
        });
      });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="cart-page-root">
        <div className="cart-page-header">
          <h1>Shopping Cart</h1>
          <p className="cart-page-subtitle">Your items</p>
        </div>
        <EmptyState
          title="Your Cart is Empty"
          description="Looks like you haven't added anything to your cart yet. Explore our collection of handcrafted artesanías."
          buttonText="Continue Shopping"
          onClick={() => navigate("/products")}
          type="cart"
        />
      </div>
    );
  }

  const shippingCost = total >= 50 ? 0 : 5;
  const finalTotal = total + shippingCost;

  return (
    <main className="cart-page-root">
      <div className="cart-page-header">
        <h1>Shopping Cart</h1>
        <p className="cart-page-subtitle">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>
      </div>

      <div className="cart-page-container">
        {/* Left: Items List */}
        <div className="cart-items-section">
          <div className="cart-items-list" role="list">
            {items.map(item => (
              <div key={item.key} className="cart-page-item" role="listitem">
                {/* Swipeable Image Gallery */}
                <CartItemGallery
                  item={item}
                  images={productImages[item.id]}
                  loading={loadingImages[item.id] === true}
                />

                {/* Product Info */}
                <div className="cart-page-item-content">
                  <div className="cart-page-item-header">
                    <h3 className="cart-page-item-name">{item.name}</h3>
                    {item.description && (
                      <p className="cart-page-item-description">{item.description}</p>
                    )}
                    {(() => {
                      const stock = item.stock ?? 99;
                      if (stock <= 0) return <p className="cart-page-item-status out"><AlertTriangle size={12} /> Out of Stock</p>;
                      if (stock <= 4) return <p className="cart-page-item-status low">Only {stock} left</p>;
                      return <p className="cart-page-item-status">In Stock</p>;
                    })()}
                  </div>

                  <div className="cart-page-item-actions">
                    <div className="cart-page-qty-group">
                      <button className="cart-page-qty-btn" onClick={() => updateQty(item.key, item.qty - 1)} aria-label="Decrease quantity">
                        <Minus size={16} />
                      </button>
                      <span className="cart-page-qty-display">{item.qty}</span>
                      <button
                        className="cart-page-qty-btn"
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        disabled={(item.stock ?? 99) > 0 && item.qty >= (item.stock ?? 99)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="cart-page-item-btns">
                      <button className="cart-page-action-btn delete-btn" onClick={() => removeFromCart(item.key)} aria-label="Delete item">
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="cart-page-item-price">
                  <p className="cart-page-unit-price">${item.price.toFixed(2)}</p>
                  <p className="cart-page-item-total">${(item.price * item.qty).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-page-subtotal-mobile">
            <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""}):</span>
            <span className="cart-page-subtotal-value">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Order Summary</h2>

            <div className="cart-summary-breakdown">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                <span className="cart-summary-value">${total.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span className="cart-summary-label">Shipping</span>
                <span className={`cart-summary-value ${shippingCost === 0 ? 'free' : ''}`}>
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <div className="cart-summary-promo">
                  <p>Add ${(50 - total).toFixed(2)} more for <strong>FREE SHIPPING!</strong></p>
                </div>
              )}
              <div className="cart-summary-divider" />
              <div className="cart-summary-total">
                <span className="cart-summary-label">Total</span>
                <span className="cart-summary-total-value">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button className="cart-checkout-cta" onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
            <button className="cart-continue-shopping" onClick={() => navigate("/")}>Continue Shopping</button>

            <div className="cart-summary-benefits">
              <div className="benefit"><Truck size={24} className="benefit-icon" /><p>Free shipping on orders over $50</p></div>
              <div className="benefit"><Lock size={24} className="benefit-icon" /><p>Secure &amp; encrypted checkout</p></div>
              <div className="benefit"><RotateCcw size={24} className="benefit-icon" /><p>30-day returns &amp; exchanges</p></div>
            </div>

            {items.length > 1 && (
              <button className="cart-clear-cart-btn" onClick={() => { if (window.confirm('Remove all items?')) clearCart(); }}>
                Clear Entire Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

