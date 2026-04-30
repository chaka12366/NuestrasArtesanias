import { ShoppingBag, Package, Search, AlertCircle } from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  title,
  description,
  buttonText,
  onClick,
  icon,
  type = "default",
  compact = false,
}) {

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
        {}
        <div className="empty-state__icon">{finalIcon}</div>

        {}
        <h2 className="empty-state__title">{title}</h2>

        {}
        {description && (
          <p className="empty-state__description">{description}</p>
        )}

        {}
        {buttonText && onClick && (
          <button className="empty-state__button" onClick={onClick}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
