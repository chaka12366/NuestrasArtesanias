import { memo } from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";
import { Truck, AlertTriangle } from "lucide-react";

const ProductCard = memo(function ProductCard({ product, category }) {
  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isInStock = stock > 5;

  const getStockStatus = () => {
    if (isOutOfStock) return "Out of Stock";
    if (isLowStock) return `Low Stock (${stock})`;
    return "In Stock";
  };

  const getStockBadgeClass = () => {
    if (isOutOfStock) return "pcard-stock-badge out";
    if (isLowStock) return "pcard-stock-badge low";
    return "pcard-stock-badge in";
  };

  const displayImage = product.images && product.images.length > 0
    ? product.images.find(img => img.is_primary)?.image_url || product.images[0].image_url
    : (product.image || product.image_url);

  console.log("Product ID:", product.id);

  return (
    <Link to={`/product/${product.id}`} className="pcard-link">
      <div className={`pcard${isOutOfStock ? " pcard-oos" : ""}`}>
        {product.tag && <span className="pcard-tag">{product.tag}</span>}

        {}
        <span className={getStockBadgeClass()}>
          {getStockStatus()}
        </span>

        {isOutOfStock && (
          <div className="pcard-oos-overlay">
            <AlertTriangle size={20} />
            <span>Out of Stock</span>
          </div>
        )}

        <div className="pcard-img-wrap">
          <img
            src={(displayImage?.startsWith('data:') || displayImage?.startsWith('http')) ? displayImage : `/${displayImage}`}
            alt={product.name}
            loading="lazy"
            onError={e => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = '/logo.png'; } else { e.target.style.display = 'none'; } }}
          />
          {product.images && product.images.length > 1 && (
            <span className="pcard-img-badge">{product.images.length} images</span>
          )}
        </div>

        <div className="pcard-body">
          <h3 className="pcard-name">{product.name}</h3>
          {isLowStock && (
            <p className="pcard-stock-warn">Only {stock} left in stock — order soon!</p>
          )}
          <p className="pcard-ship"><Truck size={14} style={{ display: "inline", marginRight: 4 }} /> Shipping Countrywide</p>
          <div className="pcard-footer">
            <span className="pcard-price">${product.price.toFixed(2)}</span>
            <button className="pcard-btn">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
