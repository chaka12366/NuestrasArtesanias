const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'CartPage.css');
const content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split('\n');

// Find where the mobile media query starts
const mediaQueryLine = lines.findIndex(l => l.includes('/* ── MOBILE (max-width: 768px) ── */'));
const part1 = lines.slice(0, mediaQueryLine).join('\n');

const newMedia = `/* ── MOBILE (max-width: 768px) ── */
@media (max-width: 768px) {
  html, body {
    overflow-x: hidden;
    width: 100%;
  }
  .cart-page-root {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    padding: 16px;
    margin-top: 0;
    box-sizing: border-box;
  }

  .cart-page-container {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Force the summary section to the top */
  .cart-summary-section {
    order: -1;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 0 4px 0 !important;
  }
  .cart-summary-card {
    padding: 0;
    border: none;
    box-shadow: none;
    background: transparent;
  }
  .cart-summary-breakdown {
    display: none;
  }
  
  .cart-summary-total {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    gap: 8px;
  }
  .cart-summary-total .cart-summary-label {
    font-size: 1.4rem;
    font-weight: 400;
    color: #0f1111;
  }
  .cart-summary-total-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f1111;
  }
  .cart-checkout-cta {
    width: 100%;
    height: 48px;
    min-height: 48px;
    font-size: 1rem;
    border-radius: 8px;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 0;
    background: #ffd814 !important;
    color: #0f1111 !important;
    border: none;
    box-shadow: 0 2px 5px rgba(213,217,217,.5) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Cart Items List */
  .cart-items-list {
    padding: 0;
    background: transparent;
    box-shadow: none;
    border: none;
    gap: 0;
    width: 100%;
    border-top: 1px solid #d5d9d9;
  }

  /* Cart Item - Amazon Style Horizontal */
  .cart-page-item {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-template-areas: 
      "img top"
      "bottom bottom";
    gap: 12px;
    padding: 16px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid #d5d9d9;
    border-radius: 0;
    box-shadow: none;
    align-items: start;
  }
  .cart-page-item:last-child {
    border-bottom: none;
  }
  .cart-page-item:hover { box-shadow: none; background: transparent; }
  .cart-page-item:active { transform: none; }

  /* Gallery/Image */
  .cg-root { grid-area: img; width: 100px !important; height: 100px !important; }
  .cg-img-wrap { width: 100px !important; height: 100px !important; border-radius: 4px; border: none; }
  .cg-img { object-fit: contain; }

  /* Details Wrapper */
  .cart-page-item-details { display: contents; }

  /* Top Section: Title & Price */
  .cart-page-item-top { grid-area: top; display: flex; flex-direction: column; gap: 4px; }
  .cart-page-item-top-left { display: flex; flex-direction: column; gap: 2px; }
  .cart-page-item-name { 
    font-size: 0.95rem; 
    font-weight: 400; 
    line-height: 1.4; 
    color: #0f1111; 
    margin: 0; 
    display: -webkit-box; 
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical; 
    overflow: hidden; 
  }
  .cart-page-item-status { font-size: 0.8rem; color: #007600; padding: 0; margin: 0; }
  .cart-page-item-price { align-items: flex-start; margin-top: 2px; }
  .cart-page-item-total { font-size: 1.1rem; font-weight: 700; color: #0f1111; margin: 0; }

  /* Bottom Section: Quantity & Actions */
  .cart-page-item-bottom { grid-area: bottom; display: flex; flex-direction: row; gap: 12px; align-items: center; justify-content: flex-start; }

  /* Qty selector */
  .cart-page-qty-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    background: #f0f2f2;
    border: 1px solid #d5d9d9;
    border-radius: 8px;
    padding: 0;
    width: 106px;
    margin: 0;
    gap: 0;
    box-shadow: 0 2px 5px rgba(213,217,217,.5);
  }
  .cart-page-qty-btn { 
    width: 32px; height: 32px; min-width: 32px; min-height: 32px; 
    border-radius: 8px; display: flex; align-items: center; justify-content: center; 
    background: transparent; color: #0f1111; padding: 0; 
  }
  .cart-page-qty-btn:hover:not(:disabled) { background: #e3e6e6; }
  .cart-page-qty-display { 
    min-width: 38px; text-align: center; font-size: 0.95rem; font-weight: 400; 
    background: #fff; height: 100%; display: flex; align-items: center; justify-content: center; 
    border-left: 1px solid #d5d9d9; border-right: 1px solid #d5d9d9; 
  }

  /* Delete & other actions */
  .cart-page-item-actions-right { display: flex; flex-direction: row; align-items: center; gap: 12px; margin: 0; }
  .cart-page-action-btn.delete-btn { 
    width: auto; height: 32px; min-height: 32px; min-width: auto; padding: 0 12px; 
    border-radius: 8px; background: #fff; border: 1px solid #d5d9d9; color: #0f1111; 
    display: flex; align-items: center; justify-content: center; 
    box-shadow: 0 2px 5px rgba(213,217,217,.5); 
  }
  .cart-page-action-btn.delete-btn svg { display: none; }
  .delete-text { display: block !important; font-size: 0.85rem; font-weight: 400; }
  
  /* Utils */
  .mobile-only { display: block !important; }
  .desktop-only { display: none !important; }
  .cart-page-subtotal-mobile { display: none !important; }
  .cart-continue-shopping { display: none; }
  .cart-summary-title, .cart-summary-promo, .cart-summary-benefits, .cart-clear-cart-btn { display: none; }
  .cart-summary-divider { display: none; }
  .cart-page-item-description { display: none; }
  .cart-page-unit-price { display: none !important; }
  .cg-btn { display: none; }
  .cg-counter { display: none; }
  .cg-thumbs, .cg-dots { display: none; }
  
  .cart-page-header { margin-bottom: 8px; }
  .cart-page-header h1 { font-size: 1.5rem; font-weight: 400; }
  .cart-page-header p { display: none; }
  
  .cart-page-empty { margin-top: 60px; padding: 40px 20px; }
  .cart-empty-container h1 { font-size: 1.5rem; }
}
`;

fs.writeFileSync(cssPath, part1 + '\\n' + newMedia);
console.log('Done!');
