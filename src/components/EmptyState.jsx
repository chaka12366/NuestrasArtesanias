import { ShoppingBag, Package, Search, AlertCircle } from "lucide-react";
import "./EmptyState.css";

/**
 * Reusable EmptyState Component
 * 
 * Props:
 * - title (string): Main message displayed
 * - description (string, optional): Supporting text
 * - buttonText (string, optional): CTA button label
 * - onClick (function, optional): CTA button click handler
 * - icon (ReactNode, optional): Custom icon (defaults to ShoppingBag)
 * - type (string, optional): "cart" | "orders" | "products" | "search" - affects styling/icon
 * - compact (boolean, optional): Smaller padding for inline usage
 */
export default function EmptyState({
  title,
  description,
  buttonText,
  onClick,
  icon,
  type = "default",
  compact = false,
}) {
  // Default icons by type
  const getDefaultIcon = () => {
    switch (type) {
      case "cart":
        return <ShoppingBag size={64} />;
      case "orders":
        return <Package size={64} />;
      case "products":
        return <AlertCircle size={64} />;
      case "search":
        return <Search size={64} />;
      default:
        return <ShoppingBag size={64} />;
    }
  };

  const finalIcon = icon || getDefaultIcon();

  return (
    <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}>
      <div className="empty-state__content">
        {/* Icon */}
        <div className="empty-state__icon">{finalIcon}</div>

        {/* Title */}
        <h2 className="empty-state__title">{title}</h2>

        {/* Description */}
        {description && (
          <p className="empty-state__description">{description}</p>
        )}

        {/* CTA Button */}
        {buttonText && onClick && (
          <button className="empty-state__button" onClick={onClick}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
