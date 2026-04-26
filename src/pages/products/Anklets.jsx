import { useState, useEffect } from "react";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory } from "../../lib/products.js";

export default function Anklets() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory("anklets").then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return <ProductPage title="Anklets" subtitle="Makeup & beauty essentials" products={products} category="anklets" loading={loading} />;
}
