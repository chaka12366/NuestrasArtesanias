import { useState, useEffect } from "react";
import "./Contact.css";
import { fetchStoreSettings } from "../lib/dashboard.js";

const DEFAULT_SOCIALS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    handle: "+501-623-3964",
    url: "https://wa.me/15016233964",
    color: "#25D366",
    hover: "#20ba5a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a8.06 8.06 0 00-8.062 8.062c0 1.404.364 2.77 1.057 3.99L2.885 22.55l4.26-1.408c1.165.638 2.475 .975 3.828.975h.005a8.062 8.062 0 008.062-8.062 8.047 8.047 0 00-2.362-5.7 8.05 8.05 0 00-5.7-2.354"/>
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@_nuestrasartesanias_",
    url: "https://www.instagram.com/_nuestrasartesanias_/",
    color: "#E1306C",
    hover: "#c2185b",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email Us",
    handle: "nuestrasartesanias@gmail.com",
    url: "mailto:nuestrasartesanias@gmail.com",
    color: "#EA4335",
    hover: "#d33426",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Call Us",
    handle: "+501 600-0000",
    url: "tel:+5016000000",
    color: "#34A853",
    hover: "#2b8a44",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
    ),
  },
];

export default function Contact() {
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);

  useEffect(() => {
    // Check localStorage for instant loading
    const cached = localStorage.getItem("storeSettings");
    if (cached) {
      applyStoreSettings(JSON.parse(cached));
    }
    
    // Fetch fresh from Supabase
    fetchStoreSettings().then(data => {
      if (data) {
        applyStoreSettings(data);
        localStorage.setItem("storeSettings", JSON.stringify(data));
      }
    }).catch(console.error);
  }, []);

  // Helper to extract a clean display handle from a potential URL
  const getCleanHandle = (input, type) => {
    if (!input) return "";
    let clean = input.trim();
    
    // Remove protocol and www
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    if (type === "instagram" || type === "facebook") {
      // Strip domains
      clean = clean.replace(/instagram\.com\//i, '').replace(/facebook\.com\//i, '');
      // Strip trailing slashes and query params
      clean = clean.replace(/\/$/, '').split('?')[0];
      // Ensure '@' prefix
      return clean.startsWith('@') ? clean : `@${clean}`;
    }
    return input; // return original for email/phone
  };

  // Helper to build the correct href URL
  const getHrefUrl = (input, type) => {
    if (!input) return "";
    const cleanInput = input.trim();
    
    // If it's already a full valid URL, return it directly
    if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
      return cleanInput;
    }
    
    if (type === "instagram") {
      const handle = cleanInput.replace('@', '');
      return `https://www.instagram.com/${handle}`;
    }
    if (type === "whatsapp") {
      const digits = cleanInput.replace(/\D/g, '');
      return `https://wa.me/${digits}`;
    }
    if (type === "phone") {
      const digits = cleanInput.replace(/\D/g, '');
      return `tel:+${digits}`;
    }
    if (type === "email") {
      return `mailto:${cleanInput}`;
    }
    return cleanInput;
  };

  const applyStoreSettings = (store) => {
    setSocials(prev => prev.map(s => {
      if (s.id === "whatsapp" && store.whatsapp) {
        return { ...s, handle: store.whatsapp, url: getHrefUrl(store.whatsapp, "whatsapp") };
      }
      if (s.id === "instagram" && store.instagram) {
        return { ...s, handle: getCleanHandle(store.instagram, "instagram"), url: getHrefUrl(store.instagram, "instagram") };
      }
      if (s.id === "email" && store.email) {
        return { ...s, handle: store.email, url: getHrefUrl(store.email, "email") };
      }
      if (s.id === "phone" && store.phone) {
        return { ...s, handle: store.phone, url: getHrefUrl(store.phone, "phone") };
      }
      return s;
    }));
  };

  return (
    <main className="contact-root">
      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <p className="contact-eyebrow">Get In Touch</p>
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-hero-sub">We'd love to hear from you!</p>
        </div>
        <div className="contact-wave">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#faf5f0" />
          </svg>
        </div>
      </section>

      <div className="contact-body">
        {/* Social cards */}
        <section className="contact-section">
          <h2 className="contact-section-title">Follow Us</h2>
          <p className="contact-section-sub">Stay connected on our social platforms</p>

          <div className="social-grid">
            {socials.map(s => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="social-card"
                style={{ "--scolor": s.color, "--shover": s.hover }}
              >
                <div className="social-icon-wrap">
                  {s.icon}
                </div>
                <div className="social-info">
                  <span className="social-label">{s.label}</span>
                  <span className="social-handle">{s.handle}</span>
                </div>
                <span className="social-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
