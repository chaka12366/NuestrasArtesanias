import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchProductById } from "../lib/products.js";
import { useCart } from "../contexts/CartContext.jsx";
import {
  ShoppingCart, Truck, Shield, RotateCcw,
  Star, ChevronRight, ChevronLeft, Plus, Minus, Package,
  CheckCircle, Heart, MessageCircle, Share2,
  AlertTriangle, ChevronUp, ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";
import "./ProductDetail.css";

const DEFAULT_CONTACT = {
  whatsapp: "+501-624-3964",
  instagram: "@_nuestrasartesanias_",
};

function seededNum(id, offset, min, max) {
  return min + ((id * 37 + offset) % (max - min + 1));
}

function getFeatures(category) {
  const map = {
    bracelets:   ["Handcrafted by local artisans", "Premium metal finishes", "Adjustable sizing", "Gift-ready packaging"],
    bracklets:   ["Handcrafted by local artisans", "Premium metal finishes", "Adjustable sizing", "Gift-ready packaging"],
    anklets:     ["Handcrafted design", "High-quality materials", "Comfortable fit", "Authentic Belizean craftsmanship"],
    beauty:      ["High-quality materials", "Authentic Belizean craftsmanship", "Premium formula", "Ethically sourced"],
    waistchains: ["Adjustable clasp", "Tarnish-resistant coating", "Lightweight & comfortable", "Pairs with any outfit"],
    necklaces:   ["Premium materials", "Expert craftsmanship", "Multiple wear options", "Authentic design"],
    bags:        ["Premium materials", "Expert craftsmanship", "Multiple wear options", "Authentic design"],
    earrings:    ["Handcrafted artistry", "Quality materials", "Comfortable wear", "Sensitive ear friendly"],
    apparel:     ["Handcrafted artistry", "Quality materials", "Comfortable wear", "Sensitive ear friendly"],
  };
  return map[category] ?? ["Premium quality", "Handcrafted", "Fast shipping", "30-day returns"];
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate          = useNavigate();
  const { addToCart, setDrawerOpen } = useCart();

  const [product, setProduct]     = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);
  const [wished,  setWished]  = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedTimeoutId, setAddedTimeoutId] = useState(null);
  const [contactInfo, setContactInfo] = useState(DEFAULT_CONTACT);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [desktopImageIndex, setDesktopImageIndex] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const thumbContainerRef = useRef(null);
  const mobileSwipeRef = useRef(null);
  const desktopScrollRef = useRef(null);
  const isScrollSyncing = useRef(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const handleMobileScroll = useCallback(() => {
    const container = mobileSwipeRef.current;
    if (!container || isScrollSyncing.current) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    if (itemWidth === 0) return;

    const imageArray = product?.images?.length > 0 ? product.images : [{ id: 0, image_url: product?.image, is_primary: true }];
    const newIndex = Math.round(scrollLeft / itemWidth);
    const clamped = Math.max(0, Math.min(newIndex, imageArray.length - 1));
    if (clamped !== currentImageIndex) {
      setCurrentImageIndex(clamped);
    }
  }, [currentImageIndex, product]);

  const handleDesktopScroll = useCallback(() => {
    const container = desktopScrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    if (itemWidth === 0) return;

    const imageArray = product?.images?.length > 0 ? product.images : [{ id: 0, image_url: product?.image, is_primary: true }];
    const newIndex = Math.round(scrollLeft / itemWidth);
    const clamped = Math.max(0, Math.min(newIndex, imageArray.length - 1));
    if (clamped !== desktopImageIndex) {
      setDesktopImageIndex(clamped);
    }
  }, [desktopImageIndex, product]);

  useEffect(() => {
    console.log("Product ID (Detail):", id);
    setLoadingProduct(true);
    fetchProductById(parseInt(id))
      .then(data => {
        setProduct(data);
        setLoadingProduct(false);
      })
      .catch(err => {

        setProduct(null);
        setLoadingProduct(false);
      });
  }, [id]);

  useEffect(() => {
    let timer;
    if (loadingProduct) timer = setTimeout(() => setShowLoading(true), 300);
    else setShowLoading(false);
    return () => clearTimeout(timer);
  }, [loadingProduct]);

  useEffect(() => {
    return () => {
      if (addedTimeoutId) clearTimeout(addedTimeoutId);
    };
  }, [addedTimeoutId]);

  useEffect(() => {
    try {
      const storeSettings = localStorage.getItem("storeSettings");
      if (storeSettings) {
        const settings = JSON.parse(storeSettings);
        if (settings.whatsapp || settings.instagram) {
          setContactInfo({
            whatsapp: settings.whatsapp || DEFAULT_CONTACT.whatsapp,
            instagram: settings.instagram || DEFAULT_CONTACT.instagram,
          });
        }
      }
    } catch (err) {

    }
  }, []);

  useEffect(() => {
    const container = mobileSwipeRef.current;
    if (!container) return;
    const targetScroll = currentImageIndex * container.offsetWidth;

    if (Math.abs(container.scrollLeft - targetScroll) > 2) {
      isScrollSyncing.current = true;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });

      setTimeout(() => { isScrollSyncing.current = false; }, 400);
    }
  }, [currentImageIndex]);

  if (loadingProduct) return (
    showLoading ? (
      <main className="pd-root">
        <style>{`
          @keyframes pd-shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .pd-skel {
            background: linear-gradient(90deg, rgba(201,149,106,0.08) 25%, rgba(201,149,106,0.18) 50%, rgba(201,149,106,0.08) 75%);
            background-size: 800px 100%;
            animation: pd-shimmer 1.5s infinite ease-in-out;
            border-radius: 8px;
          }
        `}</style>
        <nav className="pd-breadcrumb" aria-label="breadcrumb">
          <div className="pd-skel" style={{ width: 200, height: 14 }} />
        </nav>
        <div className="pd-layout">
          <div className="pd-img-col">
            <div className="pd-skel" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16 }} />
          </div>
          <div className="pd-info-col">
            <div className="pd-skel" style={{ width: '75%', height: 28, marginBottom: 16 }} />
            <div className="pd-skel" style={{ width: '40%', height: 16, marginBottom: 12 }} />
            <div className="pd-skel" style={{ width: '100%', height: 1, marginBottom: 16 }} />
            <div className="pd-skel" style={{ width: '30%', height: 32, marginBottom: 16 }} />
            <div className="pd-skel" style={{ width: '100%', height: 1, marginBottom: 16 }} />
            <div className="pd-skel" style={{ width: '100%', height: 80, marginBottom: 16 }} />
            <div className="pd-skel" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="pd-skel" style={{ width: '55%', height: 14, marginBottom: 8 }} />
            <div className="pd-skel" style={{ width: '50%', height: 14 }} />
          </div>
          <div className="pd-buy-col">
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(201,149,106,0.15)' }}>
              <div className="pd-skel" style={{ width: '40%', height: 28, marginBottom: 16 }} />
              <div className="pd-skel" style={{ width: '100%', height: 40, marginBottom: 12 }} />
              <div className="pd-skel" style={{ width: '100%', height: 40 }} />
            </div>
          </div>
        </div>
      </main>
    ) : (
      <div className="pd-root" style={{ minHeight: "80vh" }}></div>
    )
  );

  if (!product) return (
    <div className="pd-root">
      <nav className="pd-breadcrumb" aria-label="breadcrumb">
        <Link to="/">Home</Link>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>404</div>
        <p style={{ fontSize: 18, color: '#7c3d26', fontWeight: 500 }}>Product not found</p>
        <p style={{ color: '#999', maxWidth: 400 }}>This product may have been removed or is out of stock. Please check back or explore our other collections.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Link to={`/${product?.category || 'products'}`} style={{ padding: '10px 20px', background: '#c9956a', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>← Back to {product?.category || 'Products'}</Link>
          <Link to="/" style={{ padding: '10px 20px', background: '#f5ece0', color: '#7c3d26', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        </div>
      </div>
    </div>
  );

  const catLabel = product.categoryName || (product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Products');

  const stock        = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock   = stock > 0 && stock <= 5;
  const reviewCount  = seededNum(product.id, 7, 42, 284);
  const ratingStars  = seededNum(product.id, 3, 4, 5);
  const ratingDecimal= (ratingStars - 0.1 + (product.id % 3) * 0.1).toFixed(1);
  const originalPrice = +(product.price * 1.2).toFixed(2);
  const savings       = +(originalPrice - product.price).toFixed(2);
  const discountPct   = Math.round((savings / originalPrice) * 100);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + seededNum(product.id, 2, 3, 7));
  const deliveryStr  = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 0, image_url: product.image, is_primary: true }];

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage?.image_url || product.image || '/logo.png';
  const hasMultipleImages = images.length > 1;

  function switchImage(idx) {
    if (idx === currentImageIndex) return;
    setImgFading(true);
    setTimeout(() => {
      setCurrentImageIndex(idx);
      setImgFading(false);
    }, 150);

    const thumbEl = thumbContainerRef.current?.children[idx];
    if (thumbEl) {
      thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  function handlePrevImage() {
    switchImage(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
  }

  function handleNextImage() {
    switchImage(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
  }

  function handleThumbScroll(direction) {
    const container = thumbContainerRef.current;
    if (!container) return;
    const scrollAmount = 80;
    container.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  const handleMouseDown = (e) => {
    const container = e.currentTarget;
    if (!container) return;
    isDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeftStart.current = container.scrollLeft;

    container.style.scrollSnapType = 'none';
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const containers = [desktopScrollRef.current, mobileSwipeRef.current];
    containers.forEach(container => {
      if (container) container.style.scrollSnapType = 'x mandatory';
    });
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const containers = [desktopScrollRef.current, mobileSwipeRef.current];
    containers.forEach(container => {
      if (!container) return;
      container.style.scrollSnapType = 'x mandatory';

      const imageArray = product?.images?.length > 0 ? product.images : [{ id: 0, image_url: product?.image, is_primary: true }];

      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(container.scrollLeft / itemWidth);
      const clamped = Math.max(0, Math.min(newIndex, imageArray.length - 1));
      container.scrollTo({ left: clamped * itemWidth, behavior: 'smooth' });
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const container = e.currentTarget;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    container.scrollLeft = scrollLeftStart.current - walk;
  };

  function handleAddToCart() {
    if (isOutOfStock || addingToCart) {
      if (isOutOfStock) {
        toast.error("This item is out of stock");
      }
      return;
    }

    if (qty > stock) {
      const maxPossible = Math.max(1, stock);
      toast.error(`Only ${maxPossible} item${maxPossible !== 1 ? 's' : ''} available in stock`);
      setQty(maxPossible);
      return;
    }

    setAddingToCart(true);
    addToCart(product, qty);
    setAdded(true);

    if (addedTimeoutId) clearTimeout(addedTimeoutId);
    const timeoutId = setTimeout(() => {
      setAdded(false);
      setAddingToCart(false);
    }, 2500);
    setAddedTimeoutId(timeoutId);
    setDrawerOpen(true);
  }

  function handleContinueShopping() {
    navigate(`/${product?.category || ''}`);
  }

  const handleQuantityIncrease = () => {
    if (isOutOfStock || qty >= stock) return;
    setQty(q => Math.min(stock, q + 1));
  };

  const handleQuantityDecrease = () => {
    if (qty <= 1) return;
    setQty(q => Math.max(1, q - 1));
  };

  return (
    <main className="pd-root">

      {}
      <nav className="pd-breadcrumb" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} />
        <Link to={`/${product.category}`}>{catLabel}</Link>
        <ChevronRight size={13} />
        <span>{product.name}</span>
      </nav>

      {}
      <div className="pd-layout">

        {}
        <div className="pd-img-col">
          <div className="pd-gallery">

            {}
            <div className="pd-img-card pd-img-card-desktop">
              {product.tag && <span className="pd-badge">{product.tag}</span>}
              <button
                className={`pd-wish-btn ${wished ? "wished" : ""}`}
                onClick={() => {
                  if (wished) {
                    toast.info("Removed from wishlist");
                  } else {
                    toast.success("Added to wishlist");
                  }
                  setWished(!wished);
                }}
                aria-label="Add to wishlist"
              >
                <Heart size={18} fill={wished ? "#e05454" : "none"} color={wished ? "#e05454" : "#aaa"} />
              </button>

              {}
              <div
                className="pd-desktop-scroll-track"
                ref={desktopScrollRef}
                onScroll={handleDesktopScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                {images.map((img, idx) => (
                  <div className="pd-desktop-scroll-slide" key={img.id ?? idx}>
                    <img
                      src={(img.image_url?.startsWith('data:') || img.image_url?.startsWith('http')) ? img.image_url : `/${img.image_url}`}
                      alt={`${product.name} - ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      draggable={false}
                      onError={e => { e.target.src = "/logo.png"; }}
                    />
                  </div>
                ))}
              </div>

              {}
              {hasMultipleImages && (
                <div className="pd-desktop-dots">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`pd-desktop-dot ${idx === desktopImageIndex ? 'active' : ''}`}
                      onClick={() => {
                        const container = desktopScrollRef.current;
                        if (container) {
                          container.scrollTo({ left: idx * container.offsetWidth, behavior: 'smooth' });
                        }
                      }}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

            </div>

          </div>

          {}
          <div className="pd-swipe-gallery">
            {}
            {product.tag && <span className="pd-badge pd-swipe-badge">{product.tag}</span>}
            <button
              className={`pd-wish-btn pd-swipe-wish ${wished ? "wished" : ""}`}
              onClick={() => {
                if (wished) { toast.info("Removed from wishlist"); }
                else { toast.success("Added to wishlist"); }
                setWished(!wished);
              }}
              aria-label="Add to wishlist"
            >
              <Heart size={18} fill={wished ? "#e05454" : "none"} color={wished ? "#e05454" : "#aaa"} />
            </button>

            {}
            <div
              className="pd-swipe-track"
              ref={mobileSwipeRef}
              onScroll={handleMobileScroll}
            >
              {images.map((img, idx) => (
                <div className="pd-swipe-slide" key={img.id ?? idx}>
                  <img
                    src={(img.image_url?.startsWith('data:') || img.image_url?.startsWith('http')) ? img.image_url : `/${img.image_url}`}
                    alt={`${product.name} - ${idx + 1}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    draggable={false}
                    onError={e => { e.target.src = "/logo.png"; }}
                  />
                </div>
              ))}
            </div>

            {}
            {hasMultipleImages && (
              <div className="pd-swipe-dots">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={`pd-swipe-dot ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      const container = mobileSwipeRef.current;
                      if (container) {
                        container.scrollTo({ left: idx * container.offsetWidth, behavior: 'smooth' });
                      }
                    }}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

        </div>

        {}
        <div className="pd-info-col">
          <h1 className="pd-name">{product.name}</h1>

          {}
          <div className="pd-stars-row">
            <div className="pd-stars">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= ratingStars ? "#f5a623" : "none"}
                  color={s <= ratingStars ? "#f5a623" : "#ddd"}
                />
              ))}
            </div>
            <span className="pd-rating-num">{ratingDecimal}</span>
            <span className="pd-review-count">({reviewCount} reviews)</span>
          </div>

          <hr className="pd-divider" />

          {}
          <div className="pd-price-block">
            <span className="pd-price">${product.price.toFixed(2)}</span>
          </div>

          <hr className="pd-divider" />

          {}
          <div className="pd-desc-section">
            <h3>About this item</h3>
            <p className="pd-desc-text">{product.description || 'No description available.'}</p>
          </div>

          {}
          <ul className="pd-features">
            {getFeatures(product.category).map((f, i) => (
              <li key={i}>
                <CheckCircle size={14} color="#2a9d5c" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {}
          <div className="pd-mobile-inline">
            {}
            <div className={`pd-stock ${isOutOfStock ? "out" : stock <= 4 ? "low" : "ok"}`}>
              {isOutOfStock ? <AlertTriangle size={14} /> : <Package size={14} />}
              {isOutOfStock
                ? "Out of Stock"
                : stock <= 4
                  ? `Only ${stock} left in stock — order soon!`
                  : `In Stock — ${stock} units available`}
            </div>

            {}
            <div className="pd-qty-row">
              <label htmlFor="qty-input-mobile">Quantity:</label>
              <div className="pd-qty-ctrl">
                <button
                  className="pd-qty-btn"
                  onClick={handleQuantityDecrease}
                  disabled={isOutOfStock || qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span id="qty-input-mobile" className="pd-qty-num" role="status" aria-live="polite">{isOutOfStock ? 0 : qty}</span>
                <button
                  className="pd-qty-btn"
                  onClick={handleQuantityIncrease}
                  disabled={isOutOfStock || qty >= stock}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {}
            <button
              className={`pd-add-btn ${added ? "added" : ""}${isOutOfStock || addingToCart ? " disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              style={addingToCart ? { opacity: 0.7 } : {}}
            >
              {isOutOfStock ? (
                <><AlertTriangle size={18} /> Out of Stock</>
              ) : addingToCart ? (
                <><ShoppingCart size={18} /> Adding...</>
              ) : (
                <><ShoppingCart size={18} /> {added ? "Added to Cart ✓" : "Add to Cart"}</>
              )}
            </button>

            {}
            <div className="pd-payment-info">
              <p className="pd-payment-note">
                <strong>No online payments</strong> — Orders confirmed directly with the owner
              </p>
            </div>

            {}
            <button
              className={`pd-buy-now-btn${isOutOfStock ? " disabled" : ""}`}
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </button>
          </div>

          {}
          <div className="pd-badges">
            <div className="pd-badge-item">
              <Truck size={18} />
              <div>
                <strong>Shipping Price</strong>
                <span>Will be quoted via WhatsApp or IG</span>
              </div>
            </div>
            <div className="pd-badge-item">
              <Package size={18} />
              <div>
                <strong>Handmade to Order</strong>
                <span>5-14 days processing</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="pd-buy-col">
          <div className="pd-buy-box pd-buy-box-desktop">

            {}
            <div className="pd-buy-price">${product.price.toFixed(2)}</div>

            {}
            <div className="pd-processing">
              <Package size={15} color="#2a9d5c" />
              <div>
                <span className="pd-proc-label">Processing Time</span>
                <strong>5-14 days</strong>
              </div>
            </div>

            {}
            <div className={`pd-stock ${isOutOfStock ? "out" : stock <= 4 ? "low" : "ok"}`}>
              {isOutOfStock ? <AlertTriangle size={14} /> : <Package size={14} />}
              {isOutOfStock
                ? "Out of Stock"
                : stock <= 4
                  ? `Only ${stock} left in stock — order soon!`
                  : `In Stock — ${stock} units available`}
            </div>

            <hr className="pd-buy-divider" />

            {}
            <div className="pd-qty-row">
              <label htmlFor="qty-input">Quantity:</label>
              <div className="pd-qty-ctrl">
                <button
                  className="pd-qty-btn"
                  onClick={handleQuantityDecrease}
                  disabled={isOutOfStock || qty <= 1}
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span id="qty-input" className="pd-qty-num" role="status" aria-live="polite">{isOutOfStock ? 0 : qty}</span>
                <button
                  className="pd-qty-btn"
                  onClick={handleQuantityIncrease}
                  disabled={isOutOfStock || qty >= stock}
                  aria-label="Increase quantity"
                  title={isOutOfStock ? "Out of stock" : qty >= stock ? `Maximum ${stock} available` : "Increase quantity"}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {}
            <button
              className={`pd-add-btn ${added ? "added" : ""}${isOutOfStock || addingToCart ? " disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              style={addingToCart ? { opacity: 0.7 } : {}}
            >
              {isOutOfStock ? (
                <><AlertTriangle size={18} /> Out of Stock</>
              ) : addingToCart ? (
                <><ShoppingCart size={18} /> Adding...</>
              ) : (
                <><ShoppingCart size={18} /> {added ? "Added to Cart ✓" : "Add to Cart"}</>
              )}
            </button>

            <button
              className={`pd-buy-now-btn${isOutOfStock ? " disabled" : ""}`}
              onClick={handleContinueShopping}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Unavailable" : "Continue Shopping"}
            </button>

            {}
            <div className="pd-payment-info">
              <p className="pd-payment-note">
                <strong>No online payments</strong> — Orders confirmed directly with the owner
              </p>
            </div>

            {}
            <p className="pd-trust">
              <Shield size={13} /> Secure & encrypted checkout
            </p>
          </div>
        </div>

        {}
        <div className="pd-mobile-sticky-bar">
          <div className="pd-sticky-price">${product.price.toFixed(2)}</div>
          <button
            className={`pd-sticky-add-btn ${added ? "added" : ""}${isOutOfStock || addingToCart ? " disabled" : ""}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || addingToCart}
          >
            {isOutOfStock ? (
              <>Out of Stock</>
            ) : addingToCart ? (
              <>Adding...</>
            ) : (
              <><ShoppingCart size={16} /> {added ? "Added ✓" : "Add to Cart"}</>
            )}
          </button>
        </div>

      </div>
    </main>
  );
}
