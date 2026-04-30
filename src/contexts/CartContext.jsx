import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { checkStockForProducts } from "../lib/products.js";
const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Failed to load cart from localStorage:", err);
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback(function addToCart(product, qty = 1) {

    if (!product || typeof product !== 'object') {
      console.error("Invalid product object:", product);
      return;
    }
    if (!product.id || !Number.isInteger(product.id)) {
      console.error("Product must have valid numeric id:", product.id);
      return;
    }
    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
      console.error("Product must have valid positive price:", product.price);
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      console.error("Quantity must be a positive integer:", qty);
      return;
    }

    const stock = product.stock ?? 0;
    if (stock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    const cappedQty = Math.min(qty, stock);
    if (qty > stock) {
      toast.warning(`Only ${stock} item${stock !== 1 ? 's' : ''} available in stock`);
    }

    setItems(prev => {
      const key = `${product.category || 'unknown'}-${product.id}`;
      const existing = prev.find(i => i.key === key);

      if (existing) {
        const newQty = existing.qty + cappedQty;

        if (newQty > stock) {
          toast.warning(`Only ${stock} of "${product.name}" available in total`, { toastId: `cap-${key}` });
          return prev.map(i => i.key === key ? { ...i, qty: stock, stock } : i);
        }
        return prev.map(i => i.key === key ? { ...i, qty: newQty, stock } : i);
      }

      return [...prev, { ...product, key, qty: cappedQty, stock }];
    });

    toast.success(`${product.name} added to cart`, { toastId: `add-${product.id}` });
  }, []);

  const removeFromCart = useCallback(function removeFromCart(key) {
    setItems(prev => {
      const item = prev.find(i => i.key === key);
      if (item) toast.info(`Removed ${item.name} from cart`, { toastId: `rm-${key}` });
      return prev.filter(i => i.key !== key);
    });
  }, []);

  const updateQty = useCallback(function updateQty(key, qty) {

    if (typeof qty !== 'number' || qty < 1) {
      removeFromCart(key);
      return;
    }

    setItems(prev => {
      const item = prev.find(i => i.key === key);
      if (!item) return prev;

      const maxQty = item.stock ?? 0;

      if (maxQty <= 0) {
        toast.warning(`"${item.name}" is now out of stock and has been removed from your cart`);
        return prev.filter(i => i.key !== key);
      }

      const clampedQty = Math.min(Math.max(qty, 1), maxQty);

      if (qty > maxQty) {
        toast.warning(`Only ${maxQty} item${maxQty !== 1 ? 's' : ''} available`, { toastId: `max-${key}` });
      }

      return prev.map(i => i.key === key ? { ...i, qty: clampedQty } : i);
    });
  }, [removeFromCart]);

  const validateCartStock = useCallback(async () => {
    if (items.length === 0) return { valid: true, issues: [] };

    const productIds = items.map(i => i.id);
    const stockMap = await checkStockForProducts(productIds);

    if (stockMap.size === 0) {

      return { valid: false, issues: [], networkError: true };
    }

    const issues = [];
    let needsUpdate = false;
    const updatedItems = items.map(item => {
      const info = stockMap.get(item.id);
      if (!info) return item;

      const available = info.stock;
      if (item.qty > available) {
        needsUpdate = true;
        if (available <= 0) {
          issues.push({ key: item.key, name: item.name, requested: item.qty, available: 0, removed: true });
          return null;
        }
        issues.push({ key: item.key, name: item.name, requested: item.qty, available, removed: false });
        return { ...item, qty: available, stock: available };
      }

      return { ...item, stock: available };
    }).filter(Boolean);

    if (needsUpdate) {
      setItems(updatedItems);
    }

    return { valid: issues.length === 0, issues };
  }, [items]);

  const clearCart = useCallback(function clearCart() {
    setItems([]);
    toast.warning("Your cart has been cleared");
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const total     = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  const contextValue = useMemo(() => ({
    items, itemCount, total,
    addToCart, removeFromCart, updateQty, clearCart,
    validateCartStock,
    drawerOpen, setDrawerOpen,
  }), [items, itemCount, total, addToCart, removeFromCart, updateQty, clearCart, validateCartStock, drawerOpen]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
