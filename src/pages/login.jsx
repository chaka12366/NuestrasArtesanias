import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-toastify";
import "./login.css";
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const isLoggingIn = useRef(false);

  // Redirect to appropriate page if already logged in (but skip if currently logging in)
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user && !isLoggingIn.current) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profile?.role === 'owner') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/customer-dashboard', { replace: true });
        }
      }
    };
    checkUser();
  }, [navigate]);

  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [emailError, setEmailError]       = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting]       = useState(false);

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (val) => {
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");

    // Validate inline (not async state updates)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 8;
    
    if (!isEmailValid || !isPasswordValid) {
      if (!isEmailValid) setEmailError("Please enter a valid email address.");
      if (!isPasswordValid) setPasswordError("Password must be at least 8 characters.");
      toast.warning("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    isLoggingIn.current = true;
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Clear form and errors on successful login
        setEmailError("");
        setPasswordError("");
        isLoggingIn.current = false;
        
        if (result.role === 'owner') {
          navigate('/dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      } else {
        // Handle specific error messages
        const errorMsg = result.error || "Login failed. Please check your credentials.";
        if (errorMsg.toLowerCase().includes("invalid")) {
          setPasswordError("Incorrect email or password. Please try again.");
        } else {
          setPasswordError(errorMsg);
        }
        isLoggingIn.current = false;
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred. Please try again.");
      isLoggingIn.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT PANEL - BRANDING */}
      <div className="login-left">
        <div className="login-logo-circle">
          <img src={logo} alt="Nuestras Artesanías" className="login-logo-img" />
        </div>
        <h1 className="login-brand">Nuestras Artesanías</h1>
        <p className="login-location">COROZAL, BELIZE</p>
        <p className="login-tagline">"Where Artisan Craftsmanship and Timeless Beauty Come to Life!"</p>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">
            Sign in with your email and password to continue
          </p>

          <div className="login-info-text" style={{ marginBottom: "20px", color: "#9a7060", fontSize: "14px", textAlign: "center" }}>
            Secure login to view orders, track deliveries, and manage your account.
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="login-field">
              <div className="login-input-wrapper">
                <input
                  type="email"
                  className={`login-input ${emailError ? "input-error" : ""}`}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => { if (e.target.value.trim()) validateEmail(e.target.value); }}
                />
              </div>
              {emailError && <span className="login-error">{emailError}</span>}
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`login-input ${passwordError ? "input-error" : ""}`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={(e) => { if (e.target.value.trim()) validatePassword(e.target.value); }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <span className="login-error">{passwordError}</span>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="login-forgot-password" onClick={(e) => { 
                e.preventDefault(); 
                if (!email) {
                  setEmailError("Please enter your email first to reset your password.");
                  return;
                }
                toast.info(`Password reset link sent to ${email}`); 
              }}>Forgot password?</a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Login"}
            </button>
          </form>

          {/* Create Account CTA */}
          <p className="login-create-account">
            Don't have an account? <a href="/create-account" className="create-link">Create Account</a> and Be Part of the Family!
          </p>
        </div>
      </div>
    </div>
  );
}
