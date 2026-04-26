import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/auth.js";
import { supabase } from "../lib/supabase.js";
import { placeOrder } from "../lib/orders.js";
import { Check, User, Package, ReceiptText, Lock, Gift, Zap, ShoppingBag, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  validateName,
  validateEmail as validateEmailUtil,
  validatePassword as validatePasswordUtil,
  validatePhone,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  validateTerms,
} from "../utils/validation.js";
import TermsAndPrivacyModal from "./TermsAndPrivacyModal";
import CheckoutProgress from "../components/CheckoutProgress.jsx";
import "./CheckoutForm.css";

const SHIPS = [
  { id: "s1", label: "Standard delivery", sub: "3-5 business days", price: 5, display: "BZD $5" },
  { id: "s2", label: "Express delivery", sub: "1-2 business days", price: 12, display: "BZD $12" },
  { id: "s3", label: "Pick up in Corozal", sub: "Free · Ready same day", price: 0, display: "Free" },
];

const DISTRICTS = ["Belize", "Cayo", "Corozal", "Orange Walk", "Stann Creek", "Toledo"];

const CITIES_BY_DISTRICT = {
  "Corozal": [
    "Corozal Town", "Buena Vista", "Calcutta", "Caledonia", "Carolina", "Chan Chen", 
    "Chunox", "Concepcion", "Consejo", "Copper Bank", "Cristo Rey", "Estrella", 
    "Libertad", "Little Belize", "Louisville", "Paraiso", "Patchacan", "Progresso", 
    "Ranchito", "San Andres", "San Antonio", "San Joaquin", "San Narciso", "San Pedro", 
    "San Roman", "San Victor", "Santa Clara", "Sarteneja", "Xaibe", "Yo Chen"
  ],
  "Orange Walk": [
    "Orange Walk Town", "Guinea Grass", "August Pine Ridge", "Blue Creek", "Carmelita", 
    "Chan Chich", "Chan Pine Ridge", "Douglas", "Fire Burn", "Honey Camp", "Indian Church", 
    "Indian Creek", "Indian Hill Estate", "Nuevo San Juan", "Petville", "Richmond Hill", 
    "San Antonio", "San Carlos", "San Estevan", "San Felipe", "San Jose", "San Jose Palmar", 
    "San Lazaro", "San Lorenzo", "San Luis", "San Pablo", "San Roman", "Santa Cruz", 
    "Santa Martha", "Shipyard", "Sylvestre Camp", "Tower Hill", "Tres Leguas", 
    "Trial Farm", "Trinidad", "Yo Creek"
  ],
  "Belize": [
    "Belize City", "Belmopan", "San Pedro", "Hattieville", "Ladyville", "Burrell Boom", 
    "Crooked Tree", "Bermudian Landing", "Flowers Bank", "Churchyard", "Freetown Sibun", 
    "Gales Point", "Gardenia", "Gracie Rock", "La Democracia", "Lemonal", "Maskall", 
    "Mussel Creek", "Rancho Dolores", "Rockstone Pond", "Sand Hill", "Santana", "Willows Bank"
  ],
  "Cayo": [
    "San Ignacio", "Santa Elena", "Benque Viejo", "Bullet Tree Falls", "Cristo Rey", 
    "Duck Run", "El Cayo", "Georgeville", "Esperanza", "Camalote", "Unitedville", 
    "San Antonio", "San Jose Succotz", "San Luis", "Santa Familia", "Spanish Lookout", 
    "Teakettle", "Valley of Peace", "Warrie Head", "Xaibe"
  ],
  "Stann Creek": [
    "Dangriga", "Placencia", "Hopkins", "Independence", "Mango Creek", "Seine Bight", 
    "Maya Beach", "Mullins River", "Kendal", "Pomona", "Sarawee", "Sittee River", 
    "Silk Grass", "Georgetown", "Riversdale"
  ],
  "Toledo": [
    "Punta Gorda", "Barranco", "Big Falls", "Blue Creek", "Crique Sarco", "Dump", 
    "Golden Stream", "Indian Creek", "Jalacte", "Laguna", "Mafredi", "Medina Bank", 
    "Mopan", "Na Lum Ca", "Otoxha", "Pueblo Viejo", "San Antonio", "San Benito Poite", 
    "San Felipe", "San Jose", "San Lucas", "San Marcos", "San Miguel", "San Pedro Columbia", 
    "San Vicente", "Santa Ana", "Santa Cruz", "Santa Elena", "Silver Creek", "Sunday Wood", "Trio"
  ]
};

function pwStrength(val) {
  return calculatePasswordStrength(val);
}
const PW_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#1e8449"];
const PW_LABELS = ["Too short", "Weak", "Fair", "Strong", "Very strong"];

/* ── Reusable Field ── */
function Field({ label, required, error, children, half }) {
  return (
    <div className={`cp-field${half ? " cp-field-half" : ""}`}>
      {label && (
        <label className="cp-label">
          {label}{required && <span className="cp-req"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="cp-err">{error}</p>}
    </div>
  );
}

/* ── Step 1: Account ── */
function StepAccount({ onNext, onGuest, user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fn: "", ln: "", email: "", phone: "", pw: "" });
  const [errors, setE] = useState({});
  const [touched, setTouched] = useState({});
  const [pwVis, setPwVis] = useState(false);
  const [strength, setStr] = useState(-1);
  const [terms, setTerms] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [news, setNews] = useState(false);
  const [termsAndPrivacyModalOpen, setTermsAndPrivacyModalOpen] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Real-time validation
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "fn":
        return validateName(value, "First name");
      case "ln":
        return validateName(value, "Last name");
      case "email":
        return validateEmailUtil(value);
      case "phone":
        return validatePhone(value);
      case "pw":
        return validatePasswordUtil(value, 8);
      default:
        return null;
    }
  };

  const handleChange = (fieldName, value) => {
    set(fieldName, value);
    setTouched(t => ({ ...t, [fieldName]: true }));
    
    const error = validateField(fieldName, value);
    setE(err => ({ ...err, [fieldName]: error || null }));
    
    // Update password strength
    if (fieldName === "pw") {
      setStr(value.length ? pwStrength(value) : -1);
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(t => ({ ...t, [fieldName]: true }));
  };

  const validate = () => {
    const e = {};
    if (!form.fn.trim() || form.fn.trim().length < 2) e.fn = "Enter at least 2 characters";
    if (!form.ln.trim() || form.ln.trim().length < 2) e.ln = "Enter at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?[\d\s()-]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number (e.g. +501 600-0000)";
    if (form.pw.length < 8) e.pw = "At least 8 characters";
    if (!terms) e.terms = "You must agree to continue";
    return e;
  };

  function friendlyError(msg) {
    const lower = (msg || "").toLowerCase();
    if (lower.includes("already registered") || lower.includes("already been registered"))
      return "This email is already registered. Try logging in instead.";
    if (lower.includes("email not confirmed"))
      return "Email confirmation is pending. You can still continue your order.";
    if (lower.includes("password") && lower.includes("short"))
      return "Password is too short — use at least 8 characters.";
    if (lower.includes("password") && lower.includes("weak"))
      return "Password is too weak. Add uppercase letters, numbers, or symbols.";
    if (lower.includes("valid email") || lower.includes("invalid"))
      return "Please enter a valid email address.";
    if (lower.includes("rate") || lower.includes("limit"))
      return "Too many attempts. Please wait a moment and try again.";
    return msg || "Something went wrong. Please try again.";
  }

  const handleNext = async () => {
    // Mark all fields as touched
    setTouched({ fn: true, ln: true, email: true, phone: true, pw: true, terms: true });
    
    const e = validate();
    setE(e);
    
    if (Object.keys(e).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    setSigningUp(true);
    setSignupError(null);

    try {
      // 1 — Create the auth user via Supabase
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.pw,
        options: {
          data: {
            first_name: form.fn.trim(),
            last_name: form.ln.trim(),
            phone: form.phone.trim(),
            role: "customer",
            newsletter: news,
          },
        },
      });

      if (signUpErr) {
        setSignupError(friendlyError(signUpErr.message));
        setSigningUp(false);
        return;
      }

      // 2 — Explicitly insert the profiles row (safe if trigger already created it)
      const newUserId = signUpData.user?.id;
      if (newUserId) {
        await supabase.from("profiles").upsert({
          id: newUserId,
          email: form.email,
          first_name: form.fn.trim(),
          last_name: form.ln.trim(),
          phone: form.phone.trim(),
          role: "customer",
          newsletter: false,
        }, { onConflict: "id" });
      }

      // 3 — Proceed to delivery step
      setSigningUp(false);
      onNext({ ...form, isNewAccount: true });

    } catch (err) {
      console.error("Signup error:", err);
      setSignupError("An unexpected error occurred. Please try again.");
      setSigningUp(false);
    }
  };

  // If user is already logged in, skip to delivery
  if (user) {
    return (
      <div className="cp-card" style={{ "--delay": "0ms" }}>
        <div className="cp-card-icon"><Check size={32} /></div>
        <h2 className="cp-card-title">Account</h2>
        <p className="cp-card-sub">Continuing as {user.email}</p>

        <div className="cp-info-box">
          <p className="cp-info-line"><strong>{user.firstName || "User"} {user.lastName || ""}</strong></p>
          <p className="cp-info-line">{user.email}</p>
        </div>

        <button className="cp-btn-primary" onClick={() => onNext({ isExisting: true })}>Continue to delivery →</button>
        <div className="cp-divider"><span>or</span></div>
        <button className="cp-btn-ghost" onClick={() => navigate("/login")}>Already have an account? Sign in</button>
      </div>
    );
  }

  return (
    <div className="cp-card" style={{ "--delay": "0ms" }}>
      <div className="cp-card-icon"><User size={32} /></div>
      <h2 className="cp-card-title">Create your account</h2>
      <p className="cp-card-sub">Save your order history and track deliveries</p>

      <div className="cp-row2">
        <Field label="First name" required error={errors.fn}>
          <input
            className={`form-input ${
              touched.fn && form.fn ? (errors.fn ? "error" : "valid") : ""
            }`}
            placeholder="Maria"
            value={form.fn}
            onChange={e => handleChange("fn", e.target.value)}
            onBlur={() => handleBlur("fn")}
            disabled={signingUp}
            autoComplete="given-name"
          />
          {touched.fn && form.fn && !errors.fn && (
            <span className="form-valid-feedback" />
          )}
        </Field>
        <Field label="Last name" required error={errors.ln}>
          <input
            className={`form-input ${
              touched.ln && form.ln ? (errors.ln ? "error" : "valid") : ""
            }`}
            placeholder="Reyes"
            value={form.ln}
            onChange={e => handleChange("ln", e.target.value)}
            onBlur={() => handleBlur("ln")}
            disabled={signingUp}
            autoComplete="family-name"
          />
          {touched.ln && form.ln && !errors.ln && (
            <span className="form-valid-feedback" />
          )}
        </Field>
      </div>

      <Field label="Email address" required error={errors.email}>
        <input
          type="email"
          className={`form-input ${
            touched.email && form.email ? (errors.email ? "error" : "valid") : ""
          }`}
          placeholder="maria@example.com"
          value={form.email}
          onChange={e => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          disabled={signingUp}
          autoComplete="email"
        />
        {touched.email && form.email && !errors.email && (
          <span className="form-valid-feedback" />
        )}
      </Field>

      <Field label="Phone number" required error={errors.phone}>
        <input
          type="tel"
          className={`form-input ${
            touched.phone && form.phone ? (errors.phone ? "error" : "valid") : ""
          }`}
          placeholder="+501 600-0000"
          value={form.phone}
          onChange={e => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          disabled={signingUp}
          autoComplete="tel"
        />
        {touched.phone && form.phone && !errors.phone && (
          <span className="form-valid-feedback" />
        )}
      </Field>

      <Field label="Password" required error={errors.pw}>
        <div className="cp-pw-wrap">
          <input
            type={pwVis ? "text" : "password"}
            className={`form-input ${
              touched.pw && form.pw ? (errors.pw ? "error" : "valid") : ""
            }`}
            placeholder="At least 8 characters"
            value={form.pw}
            onChange={e => handleChange("pw", e.target.value)}
            onBlur={() => handleBlur("pw")}
            disabled={signingUp}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="cp-pw-eye"
            onClick={() => setPwVis(v => !v)}
            aria-label={pwVis ? "Hide password" : "Show password"}
            disabled={signingUp}
          >
            {pwVis ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
        {strength >= 0 && (
          <div className="cp-pw-meter">
            <div className="cp-pw-track">
              <div
                className="cp-pw-fill"
                style={{
                  width: `${Math.max(20, (strength / 5) * 100)}%`,
                  background: PW_COLORS[Math.min(strength, 4)]
                }}
              />
            </div>
            <span className="cp-pw-label">{PW_LABELS[Math.min(strength, 4)]}</span>
          </div>
        )}
        {touched.pw && form.pw && !errors.pw && (
          <span className="form-valid-feedback" />
        )}
      </Field>

      <div className="cp-checks">
        <label className="cp-check-row">
          <input
            type="checkbox"
            checked={terms}
            onChange={e => {
              setTerms(e.target.checked);
              setTouched(t => ({ ...t, terms: true }));
              setE(err => ({
                ...err,
                terms: e.target.checked ? null : "You must agree to continue"
              }));
            }}
            disabled={signingUp}
          />
          <span>I agree to the <button type="button" className="cp-link-btn" onClick={() => setTermsAndPrivacyModalOpen(true)}>Terms of Service and Privacy Policy</button></span>
        </label>
        {errors.terms && <p className="form-error" style={{ marginTop: "4px" }}>{errors.terms}</p>}
      </div>

      {signupError && (
        <div style={{
          background: "rgba(231, 76, 60, 0.08)",
          border: "1px solid #e74c3c",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          display: "flex",
          gap: "8px",
          color: "#e74c3c",
          fontSize: "0.9rem"
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{signupError}</span>
        </div>
      )}

      <button
        className="cp-btn-primary"
        onClick={handleNext}
        disabled={signingUp || Object.values(errors).some(e => e)}
        style={signingUp || Object.values(errors).some(e => e) ? { opacity: 0.6, cursor: "not-allowed" } : {}}
      >
        {signingUp ? (
          <>
            <Loader2 size={18} className="form-spinner" />
            Creating account…
          </>
        ) : (
          "Continue →"
        )}
      </button>

      <div className="cp-divider"><span>or</span></div>
      <button className="cp-btn-ghost" onClick={() => navigate("/login")} disabled={signingUp}>Already have an account? Sign in</button>
      <TermsAndPrivacyModal isOpen={termsAndPrivacyModalOpen} onClose={() => setTermsAndPrivacyModalOpen(false)} />
    </div>
  );
}

/* ── Step 2: Delivery ── */
function StepDelivery({ onNext, onBack, user }) {
  const [form, setForm] = useState(() => ({
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    a1: "",
    a2: "",
    city: "",
    district: "",
    notes: ""
  }));
  const [errors, setE] = useState({});
  const [touched, setTouched] = useState({});
  const [ship, setShip] = useState("s1");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "name":
        return validateName(value, "Full name");
      case "district":
        return !value ? "District is required" : null;
      case "city":
        return !value ? "City is required" : null;
      default:
        return null;
    }
  };

  const handleChange = (fieldName, value) => {
    set(fieldName, value);
    setTouched(t => ({ ...t, [fieldName]: true }));
    
    const error = validateField(fieldName, value);
    setE(err => ({ ...err, [fieldName]: error || null }));
    
    // Reset city if district changes
    if (fieldName === "district") {
      set("city", "");
      setTouched(t => ({ ...t, city: false }));
      setE(err => ({ ...err, city: null }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(t => ({ ...t, [fieldName]: true }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Enter your full name";
    if (!form.city) e.city = "Select a city / town";
    if (!form.district) e.district = "Select a district";
    return e;
  };

  const handleNext = () => {
    setTouched({ name: true, district: true, city: true });
    const e = validate();
    setE(e);
    if (!Object.keys(e).length) {
      onNext({ ...form, ship: SHIPS.find(s => s.id === ship) });
    } else {
      toast.error("Please correct the highlighted fields");
    }
  };

  return (
    <div className="cp-card" style={{ "--delay": "0ms" }}>
      <div className="cp-card-icon"><Package size={32} /></div>
      <h2 className="cp-card-title">Delivery details</h2>
      <p className="cp-card-sub">Where should we send your order?</p>

      <Field label="Full name" required error={errors.name}>
        <input
          className={`form-input ${
            touched.name && form.name ? (errors.name ? "error" : "valid") : ""
          }`}
          placeholder="Maria Reyes"
          value={form.name}
          onChange={e => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          autoComplete="name"
        />
        {touched.name && form.name && !errors.name && (
          <span className="form-valid-feedback" />
        )}
      </Field>

      <div className="cp-row2">
        <Field label="District" required error={errors.district}>
          <select
            className={`form-input ${
              touched.district && form.district ? (errors.district ? "error" : "valid") : ""
            }`}
            value={form.district}
            onChange={e => handleChange("district", e.target.value)}
            onBlur={() => handleBlur("district")}
          >
            <option value="">Select…</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          {touched.district && form.district && !errors.district && (
            <span className="form-valid-feedback" />
          )}
        </Field>
        <Field label="City / Town" required error={errors.city}>
          <select
            className={`form-input ${
              touched.city && form.city ? (errors.city ? "error" : "valid") : ""
            }`}
            value={form.city}
            onChange={e => handleChange("city", e.target.value)}
            onBlur={() => handleBlur("city")}
            disabled={!form.district}
          >
            <option value="">Select…</option>
            {form.district && CITIES_BY_DISTRICT[form.district]?.map(c => <option key={c}>{c}</option>)}
          </select>
          {touched.city && form.city && !errors.city && (
            <span className="form-valid-feedback" />
          )}
        </Field>
      </div>

      <Field label="Country">
        <input value="Belize" readOnly className="cp-readonly form-input" />
      </Field>

      <Field label="Delivery notes (Optional)">
        <input
          className="form-input"
          placeholder="Gate code, landmark, special instructions…"
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
        />
      </Field>

      {/* Shipping options */}
      <div className="cp-ship-section">
        <p className="cp-ship-heading">Delivery option</p>
        {SHIPS.map(s => (
          <div key={s.id} className={`cp-ship-opt${ship === s.id ? " active" : ""}`}
            onClick={() => setShip(s.id)}>
            <div className={`cp-radio${ship === s.id ? " on" : ""}`}>
              {ship === s.id && <div className="cp-radio-dot" />}
            </div>
            <div className="cp-ship-info">
              <span className="cp-ship-label">{s.label}</span>
              <span className="cp-ship-sub">{s.sub}</span>
            </div>
            <span className="cp-ship-price">{s.display}</span>
          </div>
        ))}
      </div>

      <button
        className="cp-btn-primary"
        onClick={handleNext}
        disabled={Object.values(errors).some(e => e)}
        style={Object.values(errors).some(e => e) ? { opacity: 0.6, cursor: "not-allowed" } : {}}
      >
        Review order →
      </button>
      <button className="cp-btn-ghost" onClick={onBack}>← Back</button>
    </div>
  );
}

/* ── Step 3: Review ── */
function StepReview({ account, delivery, cartItems, cartTotal, onBack, onPlace, placing, orderError }) {
  const [pay, setPay] = useState("Cash on delivery");
  const ship = delivery.ship;
  const total = cartTotal + ship.price;

  const addrLines = [
    delivery.name,
    `${delivery.city}, ${delivery.district}`, "Belize"
  ].filter(Boolean);

  return (
    <div className="cp-card" style={{ "--delay": "0ms" }}>
      <div className="cp-card-icon"><ReceiptText size={32} /></div>
      <h2 className="cp-card-title">Review your order</h2>
      <p className="cp-card-sub">Confirm everything looks right before placing</p>

      {/* ── Cart items preview ── */}
      <div className="cp-items-preview">
        <p className="cp-info-heading"><ShoppingBag size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-2px' }} />Your items ({cartItems.length})</p>
        {cartItems.map((item, i) => (
          <motion.div
            key={item.key || i}
            className="cp-item-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="cp-item-img">
              <img
                src={(item.image?.startsWith('data:') || item.image?.startsWith('http')) ? item.image : `/${item.image}`}
                alt={item.name}
                onError={e => { e.target.src = '/logo.png'; }}
              />
            </div>
            <div className="cp-item-info">
              <span className="cp-item-name">{item.name}</span>
              <span className="cp-item-qty">Qty: {item.qty}</span>
            </div>
            <span className="cp-item-price">BZD ${(item.price * item.qty).toFixed(2)}</span>
          </motion.div>
        ))}
      </div>

      <div className="cp-summary">
        <div className="cp-summary-row"><span>Subtotal</span><span>BZD ${cartTotal.toFixed(2)}</span></div>
        <div className="cp-summary-row"><span>{ship.label}</span><span>{ship.display}</span></div>
        <div className="cp-summary-row cp-summary-total"><span>Total</span><span>BZD ${total.toFixed(2)}</span></div>
      </div>

      <div className="cp-delivery-card">
        <div className="cp-delivery-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </div>
        <div className="cp-delivery-details">
          <p className="cp-info-line">Delivery to</p>
          {addrLines.map((l, i) => <p key={i} className="cp-info-line">{l}</p>)}
        </div>
      </div>

      {account && !account.isExisting && (
        <div className="cp-info-box">
          <p className="cp-info-heading">Account</p>
          <p className="cp-info-line">{account.fn} {account.ln}</p>
          <p className="cp-info-line">{account.email}</p>
        </div>
      )}

      <div className="cp-payment-methods">
        <p className="cp-info-heading">Payment Method</p>
        
        <div className={`cp-payment-opt ${pay === "Cash on delivery" ? "active" : ""}`} onClick={() => setPay("Cash on delivery")}>
          <div className="cp-payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
          </div>
          <span className="cp-payment-label">Cash on delivery</span>
          <div className={`cp-radio ${pay === "Cash on delivery" ? "on" : ""}`}>{pay === "Cash on delivery" && <div className="cp-radio-dot" />}</div>
        </div>

        <div className={`cp-payment-opt ${pay === "Bank transfer" ? "active" : ""}`} onClick={() => setPay("Bank transfer")}>
          <div className="cp-payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
          </div>
          <span className="cp-payment-label">Bank transfer</span>
          <div className={`cp-radio ${pay === "Bank transfer" ? "on" : ""}`}>{pay === "Bank transfer" && <div className="cp-radio-dot" />}</div>
        </div>
      </div>

      <div className="cp-order-process">
        <div className="cp-order-process-icon">
          <Zap size={24} />
        </div>
        <div className="cp-order-process-content">
          <h3 className="cp-order-process-title">What happens next?</h3>
          <p className="cp-order-process-text">
            Once you place your order, the owner will receive it and contact you via WhatsApp or Instagram to confirm details and discuss shipping.
          </p>
        </div>
      </div>

      {orderError && (
        <div className="cp-err-box">
          {orderError.split('\n').map((line, i) => (
            <p key={i} className="cp-err">{i === 0 ? `⚠ ${line}` : `• ${line}`}</p>
          ))}
        </div>
      )}

      <button
        className="cp-btn-place"
        onClick={() => onPlace({ pay, total })}
        disabled={placing}
      >
        {placing ? <div className="cp-spinner" /> : <Lock size={18} />}
        {placing ? "Processing..." : `Place order · BZD $${total.toFixed(2)}`}
      </button>
      <button className="cp-btn-back" onClick={onBack} disabled={placing}>← Back to delivery</button>
      <p className="cp-secure"><Lock size={14} style={{ display: 'inline', marginRight: '5px' }} /> SSL encrypted · Safe checkout</p>
    </div>
  );
}

/* ── Step 4: Success ── */
function StepSuccess({ orderId, onShopMore }) {
  return (
    <div className="cp-card cp-success-card" style={{ "--delay": "0ms" }}>
      <div className="cp-success-ring">
        <div className="cp-success-check"><Check size={48} /></div>
      </div>
      <h2 className="cp-card-title" style={{ marginTop: "1.25rem" }}>Order placed!</h2>
      {orderId && (
        <p className="cp-card-sub" style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 auto 0.5rem" }}>
          Order ID: <span style={{ color: "var(--accent, #e67e22)" }}>{orderId}</span>
        </p>
      )}
      <p className="cp-card-sub" style={{ maxWidth: 320, margin: "0 auto 1.75rem" }}>
        Thank you! We've received your order and will confirm via WhatsApp or email shortly.
        <br /><br />Handcrafted with love from Corozal, Belize 🌺
      </p>
      <button className="cp-btn-primary" style={{ maxWidth: 220, margin: "0 auto" }} onClick={onShopMore}>
        Continue shopping →
      </button>
    </div>
  );
}

/* ── ROOT PAGE ── */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart, validateCartStock } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [account, setAccount] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Redirect to cart if checkout is accessed with an empty cart
  useEffect(() => {
    if (items.length === 0 && step < 4) {
      toast.warning("Your cart is empty. Add items before checking out.");
      navigate("/cart", { replace: true });
    }
  }, [items.length, step, navigate]);

  // Don't render checkout if cart is empty (redirect will happen via useEffect)
  if (items.length === 0 && step < 4) {
    return null;
  }

  // Calculate cart total
  const cartTotal = total || 0;

  // ── Place the order in Supabase ──
  async function handlePlaceOrder({ pay, total: grandTotal }) {
    setPlacing(true);
    setOrderError(null);
    const toastId = toast.loading("Verifying stock & placing order…");

    // ── CRITICAL: Validate stock before placing ──
    try {
      const { valid, issues } = await validateCartStock();
      if (!valid) {
        const issueMessages = issues.map(i => {
          if (i.removed) return `"${i.name}" is out of stock and was removed`;
          return `"${i.name}" — only ${i.available} available (you requested ${i.requested})`;
        });
        const errorMsg = `Some items are out of stock or limited. Please update your cart.\n${issueMessages.join('\n')}`;
        toast.update(toastId, { render: "Stock has changed — please review your cart", type: "error", isLoading: false, autoClose: 5000 });
        setOrderError(errorMsg);
        setPlacing(false);
        return;
      }
    } catch (err) {
      console.error("Stock validation error:", err);
      toast.update(toastId, { render: "Could not verify stock. Please try again.", type: "error", isLoading: false, autoClose: 3000 });
      setOrderError("Could not verify product availability. Please try again.");
      setPlacing(false);
      return;
    }

    // Determine guest vs authenticated customer info
    const isGuest = !user;
    const isNewAccount = account && !account.isExisting;

    const orderData = {
      customerId: user?.id || null,
      guestName: isGuest && isNewAccount ? `${account.fn} ${account.ln}` : (isGuest ? null : null),
      guestEmail: isGuest && isNewAccount ? account.email : null,
      guestPhone: isGuest && isNewAccount ? account.phone : null,
      deliveryName: delivery.name,
      addressLine1: "N/A",
      addressLine2: null,
      city: delivery.city,
      district: delivery.district,
      deliveryNotes: delivery.notes || null,
      shippingMethod: delivery.ship?.label || 'Standard delivery',
      shippingCost: delivery.ship?.price || 0,
      subtotal: cartTotal,
      total: grandTotal,
      paymentMethod: pay || 'Cash on delivery',
    };

    // Map cart items to the shape placeOrder expects
    const cartItems = items.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image || item.img || null,
      price: item.price,
      qty: item.qty,
    }));

    const result = await placeOrder(orderData, cartItems);

    setPlacing(false);

    if (result.success) {
      toast.update(toastId, { render: "Order placed successfully!", type: "success", isLoading: false, autoClose: 3000 });
      setOrderId(result.orderId);
      clearCart();
      setStep(4);
    } else {
      toast.update(toastId, { render: result.error || "Failed to place order", type: "error", isLoading: false, autoClose: 5000 });
      setOrderError(result.error || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="cp-root">
      {/* Background orbs */}
      <div className="cp-orb cp-orb-1" />
      <div className="cp-orb cp-orb-2" />

      <div className="cp-inner">
        {/* Header */}
        <div className="cp-header">
          <button className="cp-back-home" onClick={() => navigate("/cart")}>
            ← Back to cart
          </button>
          <div className="cp-header-brand">
            <Gift size={28} className="cp-brand-icon" />
            <span className="cp-brand-name">Nuestras Artesanías</span>
          </div>
        </div>

        {/* Title area */}
        {step < 4 && (
          <div className="cp-title-area">
            <h1 className="cp-page-title">Checkout</h1>
            <p className="cp-page-sub">
              {step === 1 && "Create your account to complete your purchase"}
              {step === 2 && "Enter your delivery details"}
              {step === 3 && "Review and place your order"}
            </p>
            <CheckoutProgress 
              currentStep={step} 
              totalSteps={3} 
              steps={["Account", "Delivery", "Review"]}
            />
          </div>
        )}

        {/* Step panels */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <StepAccount
                user={user}
                onNext={data => { setAccount(data); setStep(2); }}
                onGuest={() => { setAccount(null); setStep(2); }}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <StepDelivery
                user={user}
                onNext={data => { setDelivery(data); setStep(3); }}
                onBack={() => setStep(1)}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <StepReview
                account={account}
                delivery={delivery}
                cartItems={items}
                cartTotal={cartTotal}
                onBack={() => setStep(2)}
                onPlace={handlePlaceOrder}
                placing={placing}
                orderError={orderError}
              />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <StepSuccess orderId={orderId} onShopMore={() => { navigate("/"); }} />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="cp-footer-note">Handcrafted with love from Corozal, Belize 🌺</p>
      </div>
    </div>
  );
}
