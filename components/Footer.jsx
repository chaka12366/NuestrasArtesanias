import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Footer.css";
import logo from "../src/assets/logo.png";
import { getStoreSettings, getStoreSettingsSync } from "../src/utils/storeSettingsCache.js";

export default function Footer() {
  const [store, setStore] = useState(() => getStoreSettingsSync());

  useEffect(() => {
    getStoreSettings().then(data => {
      if (data) setStore(data);
    });
  }, []);

  const getWaLink = () => {
    const val = store.whatsapp || "5016233964";
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return `https://wa.me/${val.replace(/\D/g, '')}`;
  };

  const getIgLink = () => {
    const val = store.instagram || "_nuestrasartesanias_";
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    let clean = val.replace(/^(https?:\/\/)?(www\.)?/, '');
    clean = clean.replace(/instagram\.com\//i, '').replace(/\/$/, '').split('?')[0].replace('@', '');
    return `https://www.instagram.com/${clean}`;
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-circle">
            <img src={logo} alt={store.name} />
          </div>
          <div>
            <p className="footer-name">{store.name}</p>
            <p className="footer-tagline">{store.tagline}</p>
          </div>
        </div>

        {/* Links */}
        <div className="footer-cols">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/bracklets">Bracklets</Link>
            <Link to="/anklets">Anklets</Link>
            <Link to="/waistchains">Waist Chains</Link>
            <Link to="/necklaces">Necklaces</Link>
            <Link to="/earrings">Earrings</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Follow Us</h4>
            <a href={getWaLink()} target="_blank" rel="noreferrer">Whatsapp</a>
            <a href={getIgLink()} target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <p className="footer-credit">Handcrafted with love from Corozal, Belize</p>
      </div>
    </footer>
  );
}
