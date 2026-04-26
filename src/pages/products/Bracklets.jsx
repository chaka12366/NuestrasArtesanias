import { useState, useEffect } from "react";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory } from "../../lib/products.js";

export default function Bracklets() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory("bracklets").then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return <ProductPage title="Bracklets" subtitle="Watches, silver & more" products={products} category="bracklets" loading={loading} />;
}
