import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchFeaturedProducts } from "../lib/products.js";
import "./Home.css";
import { Truck, Sparkles, Star, Gift, Gem, Zap, Watch, Palette, ShoppingBag, Shirt } from "lucide-react";

const CATEGORIES = [
  { label: "Bracelets", to: "/bracklets", icon: <Gem size={32} />, desc: "Handcrafted bracelets & watches" },
  { label: "Anklets",     to: "/anklets",      icon: <Sparkles size={32} />, desc: "Beautiful ankle jewelry" },
  { label: "Waist Chains", to: "/waistchains",     icon: <Zap size={32} />, desc: "Statement waist accessories" },
  { label: "Necklaces",   to: "/necklaces",        icon: <Gem size={32} />, desc: "Elegant neck jewelry" },
  { label: "Earrings",    to: "/earrings",     icon: <Sparkles size={32} />, desc: "Stylish ear ornaments" },
];

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [featuredSlides, setFeaturedSlides] = useState([]);

  // Fetch featured products from Supabase
  useEffect(() => {
    fetchFeaturedProducts().then(data => setFeaturedSlides(data));
  }, []);

  // Auto-advance slider
  useEffect(() => {
    if (featuredSlides.length === 0) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % featuredSlides.length), 3500);
    return () => clearInterval(t);
  }, [featuredSlides.length]);

  const slide = featuredSlides[current];

  return (
    <main className="home-root">

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-eyebrow"><Sparkles size={16} style={{display:'inline',marginRight:4}} /> New Arrivals Every Week</p>
          <h1 className="hero-title">
            Handcrafted Beauty,<br />
            <em>Authentic Artistry</em>
          </h1>
          <p className="hero-sub">
            Bracelets, Anklets, Waist Chains, Necklaces
 &amp; Earrings — handcrafted with love from Belize.
          </p>
          <div className="hero-ctas">
            <Link to="/bracklets" className="btn-primary">Shop Now</Link>
            <Link to="/about"       className="btn-ghost">Our Story</Link>
          </div>
        </div>

        {/* Floating decorative circles */}
        <div className="hero-deco hero-deco-1" />
        <div className="hero-deco hero-deco-2" />
        <div className="hero-deco hero-deco-3" />
      </section>

      {/* ── FEATURED SLIDER ── */}
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

          {/* Dots */}
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

      {/* ── CATEGORIES ── */}
      <section className="home-categories">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Everything you need, all in one place</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <Link key={cat.to} to={cat.to} className="cat-card">
              <span className="cat-emoji">{cat.icon}</span>
              <h3 className="cat-label">{cat.label}</h3>
              <p className="cat-desc">{cat.desc}</p>
              <span className="cat-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="home-why">
        <div className="why-inner">
          <div className="why-card">
            <div className="why-icon"><Truck size={32} color="#c9956a" /></div>
            <h3>Countrywide Shipping</h3>
            <p>We ship anywhere in Belize — retail &amp; wholesale.</p>
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
