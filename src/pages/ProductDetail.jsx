import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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

/* ── Default Contact Information ───────────────────────── */
const DEFAULT_CONTACT = {
  whatsapp: "+501-624-3964",
  instagram: "@_nuestrasartesanias_",
};

/* ── Category label lookup ─────────────────────────────────── */
const categoryLabels = {
  bracklets:   "Bracklets & Jewelry",
  anklets:     "Anklets & Makeup",
  waistchains: "Waist Chains",
  necklaces:   "Bags & Accessories",
  earrings:    "Earrings & Apparel",
};

/* ── Seeded "random" helpers ───────────────────────────── */
function seededNum(id, offset, min, max) {
  return min + ((id * 37 + offset) % (max - min + 1));
}

/* ── Dynamic descriptions ──────────────────────────────── */
function getDescription(category, name) {
  const map = {
    bracklets: `Premium handcrafted ${name} made with the finest metals and stones. Each piece is carefully crafted by skilled artisans from Belize, ensuring exceptional quality and a unique charm. Whether you're dressing up or keeping it casual, this piece adds an elegant touch to any look. Perfect as a gift or a treat for yourself.`,
    anklets:   `Beautiful handcrafted ${name} that adds elegance to any ankle. Made with high-quality materials and traditional Belizean craftsmanship. Perfect for daily wear or special occasions. Each piece is unique and carries the authentic artistry of Belize.`,
    waistchains: `Elegant ${name} designed to accentuate your silhouette. Made with high-quality metals and hand-strung beads. Features an adjustable clasp to suit all body types. A stunning statement piece that pairs beautifully with crop tops, swimwear, or any casual outfit.`,
    necklaces: `Stunning ${name} crafted with premium materials and expert artistry. This piece combines traditional design with modern appeal. Perfect for layering or wearing solo as a statement piece. An ideal accessory for any occasion.`,
    earrings:  `Exquisite handcrafted ${name} that frame the face beautifully. Made from high-quality materials with attention to detail and comfort. Suitable for sensitive ears. Available in limited quantities — grab yours before they're gone!`,
  };
  return map[category] ?? `${name} — a unique handcrafted item from Nuestras Artesanías. Premium quality, made with love and care in Belize.`;
}

function getFeatures(category) {
  const map = {
    bracklets:   ["Handcrafted by local artisans", "Premium metal finishes", "Adjustable sizing", "Gift-ready packaging"],
    anklets:     ["Handcrafted design", "High-quality materials", "Comfortable fit", "Authentic Belizean craftsmanship"],
    waistchains: ["Adjustable clasp", "Tarnish-resistant coating", "Lightweight & comfortable", "Pairs with any outfit"],
    necklaces:   ["Premium materials", "Expert craftsmanship", "Multiple wear options", "Authentic design"],
    earrings:    ["Handcrafted artistry", "Quality materials", "Comfortable wear", "Sensitive ear friendly"],
  };
  return map[category] ?? ["Premium quality", "Handcrafted", "Fast shipping", "30-day returns"];
}

/* ── Component ─────────────────────────────────────────── */
export default function ProductDetail() {
  const { category, id } = useParams();
  const navigate          = useNavigate();
  const { addToCart, setDrawerOpen } = useCart();

  const [product, setProduct]     = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);
  const [wished,  setWished]  = useState(false);
  const [addedTimeoutId, setAddedTimeoutId] = useState(null);
  const [contactInfo, setContactInfo] = useState(DEFAULT_CONTACT);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const thumbContainerRef = useRef(null);

  // Fetch product from Supabase
  useEffect(() => {
    setLoadingProduct(true);
    fetchProductById(parseInt(id)).then(data => {
      setProduct(data);
      setLoadingProduct(false);
    });
  }, [id]);

  useEffect(() => {
    let timer;
    if (loadingProduct) timer = setTimeout(() => setShowLoading(true), 300);
    else setShowLoading(false);
    return () => clearTimeout(timer);
  }, [loadingProduct]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (addedTimeoutId) clearTimeout(addedTimeoutId);
    };
  }, [addedTimeoutId]);

  // Fetch contact info from store settings
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
      console.error("Failed to load store settings:", err);
    }
  }, []);

  const catLabel = categoryLabels[category] || category;

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
    <div className="pd-error">
      <p>Product not found.</p>
      <Link to={`/${category}`}>← Back to {catLabel}</Link>
    </div>
  );

  /* Derived values */
  const stock        = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock   = stock > 0 && stock <= 5;
  const reviewCount  = seededNum(product.id, 7, 42, 284);
  const ratingStars  = seededNum(product.id, 3, 4, 5);       // 4 or 5 stars
  const ratingDecimal= (ratingStars - 0.1 + (product.id % 3) * 0.1).toFixed(1);
  const originalPrice = +(product.price * 1.2).toFixed(2);
  const savings       = +(originalPrice - product.price).toFixed(2);
  const discountPct   = Math.round((savings / originalPrice) * 100);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + seededNum(product.id, 2, 3, 7));
  const deliveryStr  = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  // Get images array - use product_images if available, otherwise fall back to single image
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [{ id: 0, image_url: product.image, is_primary: true }];
  
  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage?.image_url || product.image || '/logo.png';
  const hasMultipleImages = images.length > 1;

  // Image switch with fade transition
  function switchImage(idx) {
    if (idx === currentImageIndex) return;
    setImgFading(true);
    setTimeout(() => {
      setCurrentImageIndex(idx);
      setImgFading(false);
    }, 150);
    // Scroll thumbnail into view
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

  /* Handlers */
  function handleAddToCart() {
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    // Re-check stock (safety check for race conditions)
    if (qty > stock) {
      const maxPossible = Math.max(1, stock);
      toast.error(`Only ${maxPossible} item${maxPossible !== 1 ? 's' : ''} available in stock`);
      setQty(maxPossible);
      return;
    }

    addToCart({ ...product, category }, qty);
    setAdded(true);
    // Clear any previous timeout before setting a new one
    if (addedTimeoutId) clearTimeout(addedTimeoutId);
    const timeoutId = setTimeout(() => setAdded(false), 2500);
    setAddedTimeoutId(timeoutId);
    setDrawerOpen(true);
  }

  function handleContinueShopping() {
    navigate(`/${category}`);
  }

  // Handle quantity increment with stock cap
  const handleQuantityIncrease = () => {
    if (isOutOfStock || qty >= stock) return;
    setQty(q => Math.min(stock, q + 1));
  };

  // Handle quantity decrement with minimum floor
  const handleQuantityDecrease = () => {
    if (qty <= 1) return;
    setQty(q => Math.max(1, q - 1));
  };

  return (
    <main className="pd-root">

      {/* Breadcrumb */}
      <nav className="pd-breadcrumb" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} />
        <Link to={`/${category}`}>{catLabel}</Link>
        <ChevronRight size={13} />
        <span>{product.name}</span>
      </nav>

      {/* Main layout */}
      <div className="pd-layout">

        {/* ── Col 1: Image Gallery (Amazon-style) ───── */}
        <div className="pd-img-col">
          <div className="pd-gallery">

            {/* Vertical thumbnail strip (desktop) */}
            {hasMultipleImages && (
              <div className="pd-thumb-strip">
                <button
                  className="pd-thumb-scroll-btn"
                  onClick={() => handleThumbScroll('up')}
                  aria-label="Scroll thumbnails up"
                >
                  <ChevronUp size={16} />
                </button>
                <div className="pd-thumb-list" ref={thumbContainerRef}>
                  {images.map((img, idx) => (
                    <button
                      key={img.id ?? idx}
                      className={`pd-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                      onClick={() => switchImage(idx)}
                      onMouseEnter={() => switchImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img
                        src={(img.image_url?.startsWith('data:') || img.image_url?.startsWith('http')) ? img.image_url : `/${img.image_url}`}
                        alt={`${product.name} - ${idx + 1}`}
                        loading="lazy"
                        onError={e => { e.target.src = "/logo.png"; }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  className="pd-thumb-scroll-btn"
                  onClick={() => handleThumbScroll('down')}
                  aria-label="Scroll thumbnails down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            )}

            {/* Main image card */}
            <div className="pd-img-card">
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

              <div className="pd-main-img-wrapper">
                <img
                  src={(currentImageUrl?.startsWith('data:') || currentImageUrl?.startsWith('http')) ? currentImageUrl : `/${currentImageUrl}`}
                  alt={product.name}
                  className={`pd-main-img ${imgFading ? 'fading' : ''}`}
                  loading="lazy"
                  onError={e => { e.target.src = "/logo.png"; }}
                />
              </div>

              {/* Image counter pill */}
              {hasMultipleImages && (
                <div className="pd-img-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

          </div>

          {/* Horizontal thumbnail strip (mobile only) */}
          {hasMultipleImages && (
            <div className="pd-thumb-strip-mobile">
              {images.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  className={`pd-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => switchImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={(img.image_url?.startsWith('data:') || img.image_url?.startsWith('http')) ? img.image_url : `/${img.image_url}`}
                    alt={`${product.name} - ${idx + 1}`}
                    onError={e => { e.target.src = "/logo.png"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Col 2: Info ──────────────────────────────── */}
        <div className="pd-info-col">
          <h1 className="pd-name">{product.name}</h1>

          {/* Stars + reviews */}
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

          {/* Price block */}
          <div className="pd-price-block">
            <span className="pd-price">${product.price.toFixed(2)}</span>
          </div>

          <hr className="pd-divider" />

          {/* Description */}
          <div className="pd-desc-section">
            <h3>About this item</h3>
            <p className="pd-desc-text">{getDescription(category, product.name)}</p>
          </div>

          {/* Feature bullets */}
          <ul className="pd-features">
            {getFeatures(category).map((f, i) => (
              <li key={i}>
                <CheckCircle size={14} color="#2a9d5c" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Badges row */}
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

        {/* ── Col 3: Buy Box ───────────────────────────── */}
        <div className="pd-buy-col">
          <div className="pd-buy-box">

            {/* Price */}
            <div className="pd-buy-price">${product.price.toFixed(2)}</div>

            {/* Processing Time */}
            <div className="pd-processing">
              <Package size={15} color="#2a9d5c" />
              <div>
                <span className="pd-proc-label">Processing Time</span>
                <strong>5-14 days</strong>
              </div>
            </div>

            {/* Stock */}
            <div className={`pd-stock ${isOutOfStock ? "out" : stock <= 4 ? "low" : "ok"}`}>
              {isOutOfStock ? <AlertTriangle size={14} /> : <Package size={14} />}
              {isOutOfStock
                ? "Out of Stock"
                : stock <= 4
                  ? `Only ${stock} left in stock — order soon!`
                  : `In Stock — ${stock} units available`}
            </div>

            <hr className="pd-buy-divider" />

            {/* Qty selector */}
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

            {/* Actions */}
            <button
              className={`pd-add-btn ${added ? "added" : ""}${isOutOfStock ? " disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? (
                <><AlertTriangle size={18} /> Out of Stock</>
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

            {/* Payment info */}
            <div className="pd-payment-info">
              <p className="pd-payment-note">
                <strong>No online payments</strong> — Orders confirmed directly with the owner
              </p>
            </div>

            {/* Trust line */}
            <p className="pd-trust">
              <Shield size={13} /> Secure & encrypted checkout
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
