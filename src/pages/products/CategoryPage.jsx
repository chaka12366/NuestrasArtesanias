import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProductPage from "../ProductPage.jsx";
import { fetchProductsByCategory, fetchCategories } from "../../lib/products.js";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch both products and category info to get the proper Title/Subtitle
    Promise.all([
      fetchProductsByCategory(categorySlug),
      fetchCategories()
    ]).then(([prods, cats]) => {
      const currentCat = cats.find(c => c.slug === categorySlug);
      setCategory(currentCat);
      setProducts(prods);
      setLoading(false);
    }).catch(err => {
      // Silently handle - fallback UI will be shown
      setLoading(false);
    });
  }, [categorySlug]);

  // Fallback title if category not found or still loading
  const title = category ? category.name : (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
  const subtitle = category ? category.description : "Handcrafted with passion";

  return (
    <ProductPage 
      title={title} 
      subtitle={subtitle} 
      products={products} 
      category={categorySlug} 
      loading={loading} 
    />
  );
}
