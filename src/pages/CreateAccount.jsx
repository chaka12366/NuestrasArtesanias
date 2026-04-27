import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import { toast } from "react-toastify";
import { User, Palette } from "lucide-react";
import "./CreateAccount.css";
import logo from "../assets/logo.png";
import TermsAndPrivacyModal from "./TermsAndPrivacyModal";

/**
 * CreateAccount - Account creation form component
 * 
 * Features:
 * - Email/Password registration
 * - First & Last name capture
 * - Phone number collection
 * - Password strength indicator
 * - Terms of service & newsletter opt-in
 * - Form validation with error handling
 */

function pwStrength(val) {
  let s = 0;
  if (val.length >= 8)        s++;
  if (val.length >= 12)       s++;
  if (/[A-Z]/.test(val))      s++;
  if (/[0-9]/.test(val))      s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  return s;
}

const PW_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#1e8449"];
const PW_LABELS = ["Too short", "Weak", "Fair", "Strong", "Very strong"];

/* ── Reusable Field Component ── */
function Field({ label, required, error, children, half }) {
  return (
    <div className={`ca-field${half ? " ca-field-half" : ""}`}>
      {label && (
        <label className="ca-label">
          {label}{required && <span className="ca-req"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="ca-err">{error}</p>}
    </div>
  );
}

/**
 * Account Creation Form
 */
function AccountForm({ onSuccess }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ fn: "", ln: "", email: "", phone: "", pw: "", confirmPw: "" });
  const [errors, setE] = useState({});
  const [pwVis, setPwVis] = useState(false);
  const [confirmPwVis, setConfirmPwVis] = useState(false);
  const [strength, setStr] = useState(-1);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [termsAndPrivacyModalOpen, setTermsAndPrivacyModalOpen] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fn.trim() || form.fn.trim().length < 2) e.fn = "Enter at least 2 characters";
    if (!form.ln.trim() || form.ln.trim().length < 2) e.ln = "Enter at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?[\d\s()-]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number (e.g. +501 600-0000)";
    if (form.pw.length < 8)  e.pw  = "At least 8 characters";
    if (form.pw !== form.confirmPw) e.confirmPw = "Passwords do not match";
    if (!terms)              e.terms = "You must agree to continue";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e_obj = validate();
    setE(e_obj);
    setRegisterError("");

    if (!Object.keys(e_obj).length) {
      setSubmitting(true);
      try {
        // Call register function from AuthContext
        const result = await register(
          form.email,
          form.pw,
          "customer",
          form.fn,
          form.ln,
          form.phone,
          false
        );

        if (result.success) {
          // Redirect to login page after successful registration
          navigate("/login", { replace: true });
        } else {
          const errorMsg = result.error || "Registration failed. Please try again.";
          if (errorMsg.includes("already registered")) {
            setRegisterError("This email is already registered. Please log in instead.");
          } else if (errorMsg.includes("password")) {
            setRegisterError("Password is too weak. Use at least 8 characters with uppercase, numbers, and symbols.");
          } else {
            setRegisterError(errorMsg);
          }
        }
      } catch (err) {
        setRegisterError("An error occurred during registration.");
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    } else {
      toast.warning("Please fill in all required fields");
    }
  };

  return (
    <div className="ca-wrapper">
      {/* Background orbs */}
      <div className="ca-orb ca-orb-1" />
      <div className="ca-orb ca-orb-2" />

      <div className="ca-inner">
        {/* Header */}
        <div className="ca-header">
          <button className="ca-back-home" onClick={() => navigate(-1)} type="button">
            ← Back
          </button>
          <div className="ca-header-brand">
            <Palette className="ca-brand-icon" size={24} />
            <span className="ca-brand-name">Nuestras Artesanías</span>
          </div>
        </div>

        {/* Title area */}
        <div className="ca-title-area">
          <h1 className="ca-page-title">Create Account</h1>
          <p className="ca-page-sub">
            Join us to save your order history and track deliveries
          </p>
        </div>

        {/* Form Card */}
        <div className="ca-card">
          <User className="ca-card-icon" size={32} />
          <h2 className="ca-card-title">Your Information</h2>
          <p className="ca-card-sub">Fill in the details below to get started</p>



          <form onSubmit={handleSubmit} noValidate>
            {/* Error Message */}
            {registerError && <p className="ca-error-message">{registerError}</p>}

            {/* Name Fields */}
            <div className="ca-row2">
              <Field label="First name" required error={errors.fn}>
                <input
                  className={errors.fn ? "err" : ""}
                  placeholder="Maria"
                  value={form.fn}
                  onChange={e => set("fn", e.target.value)}
                  onBlur={e => { if (e.target.value.trim() && e.target.value.trim().length >= 2) setE(prev => ({...prev, fn: undefined})); }}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last name" required error={errors.ln}>
                <input
                  className={errors.ln ? "err" : ""}
                  placeholder="Reyes"
                  value={form.ln}
                  onChange={e => set("ln", e.target.value)}
                  onBlur={e => { if (e.target.value.trim() && e.target.value.trim().length >= 2) setE(prev => ({...prev, ln: undefined})); }}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email address" required error={errors.email}>
              <input
                type="email"
                className={errors.email ? "err" : ""}
                placeholder="maria@example.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                onBlur={e => { if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.target.value)) setE(prev => ({...prev, email: undefined})); }}
                autoComplete="email"
              />
            </Field>

            {/* Phone */}
            <Field label="Phone number" required error={errors.phone}>
              <input
                type="tel"
                className={errors.phone ? "err" : ""}
                placeholder="+501 600-0000"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                onBlur={e => { if (/^\+?[\d\s()-]{7,15}$/.test(e.target.value.trim())) setE(prev => ({...prev, phone: undefined})); }}
                autoComplete="tel"
              />
            </Field>

            {/* Password */}
            <Field label="Password" required error={errors.pw}>
              <div className="ca-pw-wrap">
                <input
                  type={pwVis ? "text" : "password"}
                  className={errors.pw ? "err" : ""}
                  placeholder="At least 8 characters"
                  value={form.pw}
                  onChange={e => {
                    set("pw", e.target.value);
                    setStr(e.target.value.length ? pwStrength(e.target.value) : -1);
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="ca-pw-eye"
                  onClick={() => setPwVis(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  {pwVis ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {strength >= 0 && (
                <div className="ca-pw-meter">
                  <div className="ca-pw-track">
                    <div
                      className="ca-pw-fill"
                      style={{
                        width: `${Math.max(20, (strength / 5) * 100)}%`,
                        background: PW_COLORS[Math.min(strength, 4)],
                      }}
                    />
                  </div>
                  <span className="ca-pw-label">{PW_LABELS[Math.min(strength, 4)]}</span>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm password" required error={errors.confirmPw}>
              <div className="ca-pw-wrap">
                <input
                  type={confirmPwVis ? "text" : "password"}
                  className={errors.confirmPw ? "err" : ""}
                  placeholder="Re-enter your password"
                  value={form.confirmPw}
                  onChange={e => set("confirmPw", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="ca-pw-eye"
                  onClick={() => setConfirmPwVis(v => !v)}
                  aria-label="Toggle confirm password visibility"
                >
                  {confirmPwVis ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {/* Checkboxes */}
            <div className="ca-checks">
              <label className="ca-check-row">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                />
                <span>
                  I agree to the <button type="button" className="ca-link-btn" onClick={() => setTermsAndPrivacyModalOpen(true)}>Terms of Service and Privacy Policy</button>
                </span>
              </label>
              {errors.terms && <p className="ca-err" style={{ marginTop: "-4px" }}>{errors.terms}</p>}

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="ca-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p className="ca-login-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <p className="ca-footer-note">Handcrafted with love from Corozal, Belize 🌺</p>
      </div>

      {/* Modal */}
      <TermsAndPrivacyModal isOpen={termsAndPrivacyModalOpen} onClose={() => setTermsAndPrivacyModalOpen(false)} />
    </div>
  );
}

export default function CreateAccount() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to home after successful registration
    navigate("/", { replace: true });
  };

  return <AccountForm onSuccess={handleSuccess} />;
}
