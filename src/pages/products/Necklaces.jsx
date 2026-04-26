import { useState, useEffect } from "react";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory } from "../../lib/products.js";

export default function Necklaces() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory("necklaces").then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return <ProductPage title="Necklaces" subtitle="Elegant necklace collection" products={products} category="necklaces" loading={loading} />;
}
