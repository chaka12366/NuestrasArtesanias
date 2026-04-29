import { Link } from "react-router-dom";
import { Gem } from "lucide-react";
import "./About.css";

export default function About() {
  return (
    <main className="about-root">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <p className="about-eyebrow">Est. 2021 · Belize</p>
          <h1 className="about-title">Our Story</h1>
        </div>
        <div className="about-wave">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#faf5f0" />
          </svg>
        </div>
      </section>

      {/* Main content */}
      <section className="about-body">
        <div className="about-card">
          <div className="about-badge"><Gem size={32} /></div>
          <h2 className="about-heading">Welcome to Nuestras Artesanías!</h2>

          <p className="about-text">
            At <strong>Nuestras Artesanías</strong>, we create exquisite{" "}
            <strong>handmade beaded jewelry</strong> that tells the story of Belize. 
            Each piece is carefully crafted with meaningful beads that represent the 
            rich cultural heritage, ancient Mayan traditions, and vibrant history of 
            our beloved country.
          </p>

          <p className="about-text">
            Our <strong>artisanal jewelry collection</strong> features intricate designs 
            using authentic beads selected for their beauty and cultural significance. 
            From traditional Mayan-inspired patterns to contemporary styles, every 
            bracelet, anklet, necklace, and earring celebrates Belizean pride and craftsmanship.
          </p>

          <p className="about-text">
            Since <strong>2021</strong>, we've been passionate about preserving Belizean 
            culture through our handcrafted beaded creations. Each piece is made with 
            dedication and love, honoring the traditions passed down through generations 
            of Belizean artisans.
          </p>

          <p className="about-text">
            Whether you're looking for a meaningful gift or a personal treasure, our 
            beaded jewelry carries the spirit of Belize. <strong>We ship CountryWide</strong>, 
            so you can wear a piece of Belizean heritage wherever you are!
          </p>

          <div className="about-highlight">
            <p>NUESTRAS ARTESANÍAS — BEADED BEAUTY, CULTURAL PRIDE, & TIMELESS ARTISTRY!</p>
          </div>

          <Link to="/bracklets" className="about-cta">Explore Our Beaded Collection →</Link>
        </div>

        {/* Stats */}
        <div className="about-stats">
          <div className="about-stat">
            <span className="stat-num">2021</span>
            <span className="stat-lbl">Founded</span>
          </div>
          <div className="about-stat">
            <span className="stat-num">100%</span>
            <span className="stat-lbl">Handmade</span>
          </div>
          <div className="about-stat">
            <span className="stat-num">∞</span>
            <span className="stat-lbl">Belizean Pride</span>
          </div>
        </div>
      </section>
    </main>
  );
}
