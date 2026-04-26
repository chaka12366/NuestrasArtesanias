import { useState, useEffect, useMemo } from "react";
import ProductCard from "../../components/ProductCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useDebounce } from "../utils/useDebounce.js";
import "./ProductPage.css";
import { HelpCircle, X } from "lucide-react";

function ProductSkeleton() {
  return (
    <div className="pcard-link" style={{ pointerEvents: "none" }}>
      <div className="pcard" style={{ animation: "pp-pulse 1.5s infinite ease-in-out" }}>
        <div className="pcard-img-wrap" style={{ backgroundColor: "rgba(201,149,106,0.15)" }}></div>
        <div className="pcard-body">
          <div style={{ height: "20px", width: "70%", backgroundColor: "rgba(201,149,106,0.2)", borderRadius: "4px", marginBottom: "12px" }}></div>
          <div style={{ height: "14px", width: "50%", backgroundColor: "rgba(201,149,106,0.15)", borderRadius: "4px", marginBottom: "16px" }}></div>
          <div className="pcard-footer" style={{ borderTop: "1px solid rgba(201,149,106,0.1)", paddingTop: "14px" }}>
            <div style={{ height: "20px", width: "30%", backgroundColor: "rgba(201,149,106,0.2)", borderRadius: "4px" }}></div>
            <div style={{ height: "28px", width: "80px", backgroundColor: "rgba(201,149,106,0.15)", borderRadius: "20px" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ title, subtitle, products, category, loading }) {
  const [search, setSearch] = useState("");
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLoading(true), 300);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => (products || []).filter(p =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [products, debouncedSearch]);

  return (
    <main className="pp-root">
      <style>{`
        @keyframes pp-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .pp-fade-in {
          animation: ppFadeIn 0.4s ease-out forwards;
        }
        @keyframes ppFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Hero banner */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <p className="pp-hero-eyebrow">Artesanias Collection</p>
          <h1 className="pp-hero-title">{title}</h1>
          {subtitle && <p className="pp-hero-sub">{subtitle}</p>}
        </div>
        <div className="pp-hero-wave">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#faf5f0" />
          </svg>
        </div>
      </section>

      {/* Controls */}
      <div className="pp-controls">
        <div className="pp-search-wrap">
          <svg className="pp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pp-search"
          />
          {search && (
            <button className="pp-clear" onClick={() => setSearch("")}><X size={18} /></button>
          )}
        </div>
        <p className="pp-count">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      <div className="pp-grid-wrap">
        {loading ? (
          showLoading ? (
            <div className="pp-grid">
              {[1, 2, 3, 4, 5, 6].map(i => <ProductSkeleton key={`skel-${i}`} />)}
            </div>
          ) : (
            <div className="pp-grid" style={{ minHeight: "50vh" }}></div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Results Found"
            description={`We couldn't find any artesanías matching "${search}". Try a different keyword or clear your search.`}
            buttonText="Clear Search"
            onClick={() => setSearch("")}
            type="search"
          />
        ) : (
          <div className="pp-grid pp-fade-in">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} category={category} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
