import { useState, useEffect } from "react";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory } from "../../lib/products.js";

export default function Earrings() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory("earrings").then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return <ProductPage title="Earrings" subtitle="Statement & everyday earrings" products={products} category="earrings" loading={loading} />;
}
