import { useState, useEffect } from "react";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory } from "../../lib/products.js";

export default function Waistchains() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory("waistchains").then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return <ProductPage title="Waist Chains" subtitle="Fashion waist accessories" products={products} category="waistchains" loading={loading} />;
}
