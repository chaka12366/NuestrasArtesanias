import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchFeaturedProducts, fetchCategories } from "../lib/products.js";
import "./Home.css";
import { Truck, Sparkles, Star, Gift, Gem, Zap, ShoppingBag } from "lucide-react";

const ICON_MAP = {
  bracelets:   <Gem size={32} />,
  bracklets:   <Gem size={32} />,
  anklets:     <Sparkles size={32} />,
  beauty:      <Sparkles size={32} />,
  waistchains: <Zap size={32} />,
  'waist-chains': <Zap size={32} />,
  necklaces:   <Gem size={32} />,
  bags:        <ShoppingBag size={32} />,
  earrings:    <Sparkles size={32} />,
  apparel:     <ShoppingBag size={32} />,
};

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [featuredSlides, setFeaturedSlides] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts()
      .then(data => setFeaturedSlides(data || []))
      .catch(err => {

        setFeaturedSlides([]);
      });

    fetchCategories()
      .then(data => setCategories(data || []))
      .catch(err => {

        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (featuredSlides.length === 0) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % featuredSlides.length), 3500);
    return () => clearInterval(t);
  }, [featuredSlides.length]);

  const slide = featuredSlides[current];

  return (
    <main className="home-root">

      {}
      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-eyebrow"><Sparkles size={16} style={{display:'inline',marginRight:4}} /> New Arrivals Every Week</p>
          <h1 className="hero-title">
            Handcrafted Beauty,<br />
            <em>Authentic Artistry</em>
          </h1>
          <p className="hero-sub">
            Bracelets, Anklets, Waist Chains, Necklaces
 & Earrings — handcrafted with love from Belize.
          </p>
          <div className="hero-ctas">
            <Link to={categories.length > 0 ? `/${categories[0].slug}` : "/"} className="btn-primary">Shop Now</Link>
            <Link to="/about"       className="btn-ghost">Our Story</Link>
          </div>
        </div>

        {}
        <div className="hero-deco hero-deco-1" />
        <div className="hero-deco hero-deco-2" />
        <div className="hero-deco hero-deco-3" />
      </section>

      {}
      {slide && (
        <section className="home-slider-section">
          <div className="slider-label">Featured Products</div>
          <div className="slider-card">
            <div className="slider-img-wrap">
              <img
                src={(slide.image?.startsWith('data:') || slide.image?.startsWith('http')) ? slide.image : `/${slide.image}`}
                alt={slide.name}
                className="slider-img"
                loading="lazy"
                onError={e => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = '/logo.png'; } else { e.target.style.display = 'none'; } }}
              />
            </div>
            <div className="slider-info">
              <span className="slider-category">{slide.category}</span>
              <h2 className="slider-name">{slide.name}</h2>
              <p className="slider-price">${slide.price.toFixed(2)}</p>
              <p className="slider-ship"><Truck size={16} style={{ display: "inline", marginRight: 4 }} /> Shipping Countrywide</p>
            </div>
          </div>

          {}
          <div className="slider-dots">
            {featuredSlides.map((_, i) => (
              <button
                key={i}
                className={`slider-dot ${i === current ? "active" : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {}
      <section className="home-categories">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Everything you need, all in one place</p>
        </div>
        <div className="cat-grid">
          {categories.map(cat => (
            <Link key={cat.id} to={`/${cat.slug}`} className="cat-card">
              <span className="cat-emoji">{ICON_MAP[cat.slug] || <Gem size={32} />}</span>
              <h3 className="cat-label">{cat.name}</h3>
              <p className="cat-desc">{cat.description || "Handcrafted artisan products"}</p>
              <span className="cat-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {}
      <section className="home-why">
        <div className="why-inner">
          <div className="why-card">
            <div className="why-icon"><Truck size={32} color="#c9956a" /></div>
            <h3>Countrywide Shipping</h3>
            <p>We ship anywhere in Belize — retail & wholesale.</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><Star size={32} color="#c9956a" /></div>
            <h3>Quality You Trust</h3>
            <p>Proudly serving customers since 2021 with top-quality products.</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><Gift size={32} color="#c9956a" /></div>
            <h3>Something for Everyone</h3>
            <p>Bracelets, Anklets, Waist Chains, Necklaces & Earrings — we truly have what you need.</p>
          </div>
        </div>
      </section>

    </main>
  );
}
