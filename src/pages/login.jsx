import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-toastify";
import { validateEmail as validateEmailUtil, validatePassword as validatePasswordUtil } from "../utils/validation.js";
import "./login.css";
import logo from "../assets/logo.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const isLoggingIn = useRef(false);
  const emailInputRef = useRef(null);

  // Auto-focus email field on mount for better mobile UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current && window.innerWidth <= 768) {
        emailInputRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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
        
        // If there's a "from" location, redirect back to that page
        // Otherwise, redirect based on role
        const fromLocation = location.state?.from;
        if (fromLocation && fromLocation !== '/login') {
          navigate(fromLocation, { replace: true });
        } else if (profile?.role === 'owner') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/customer-dashboard', { replace: true });
        }
      }
    };
    checkUser();
  }, [navigate, location]);

  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [emailError, setEmailError]       = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailTouched, setEmailTouched]   = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  // Real-time email validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailTouched(true);
    
    if (value.trim()) {
      const error = validateEmailUtil(value);
      setEmailError(error || "");
    } else {
      setEmailError("");
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordTouched(true);
    
    if (value.trim()) {
      const error = validatePasswordUtil(value, 8);
      setPasswordError(error || "");
    } else {
      setPasswordError("");
    }
  };

  // On blur - mark as touched even if empty
  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (email.trim()) {
      const error = validateEmailUtil(email);
      setEmailError(error || "");
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (password.trim()) {
      const error = validatePasswordUtil(password, 8);
      setPasswordError(error || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setEmailTouched(true);
    setPasswordTouched(true);
    
    // Validate both fields
    const emailErr = validateEmailUtil(email);
    const passwordErr = validatePasswordUtil(password, 8);
    
    setEmailError(emailErr || "");
    setPasswordError(passwordErr || "");
    
    // If any errors, don't submit
    if (emailErr || passwordErr) {
      toast.error("Please correct the highlighted fields");
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
        
        // If there's a "from" location in state, redirect back to that page
        // Otherwise, redirect based on role
        const fromLocation = location.state?.from;
        if (fromLocation && fromLocation !== '/login') {
          navigate(fromLocation, { replace: true });
        } else if (result.role === 'owner') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/customer-dashboard', { replace: true });
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
              <label className="form-field-label">Email <span className="form-field-required">*</span></label>
              <div className="form-input-wrapper">
                <input
                  ref={emailInputRef}
                  type="email"
                  className={`login-input form-input ${
                    emailTouched && email ? (emailError ? "error" : "valid") : ""
                  }`}
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={submitting}
                  aria-invalid={emailTouched && !!emailError}
                  autoComplete="email"
                />
                {emailTouched && email && !emailError && (
                  <span className="form-input-icon valid">✓</span>
                )}
                {emailTouched && emailError && (
                  <span className="form-input-icon error">✕</span>
                )}
              </div>
              {emailTouched && emailError && (
                <span className="form-error">{emailError}</span>
              )}
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="form-field-label">Password <span className="form-field-required">*</span></label>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`login-input form-input ${
                    passwordTouched && password ? (passwordError ? "error" : "valid") : ""
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  disabled={submitting}
                  aria-invalid={passwordTouched && !!passwordError}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordTouched && passwordError && (
                <span className="form-error">{passwordError}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={submitting}
                />
                <span>Remember me</span>
              </label>
              <button 
                type="button"
                className="login-forgot-password"
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (!email) {
                    toast.warning("Please enter your email to reset password");
                    return;
                  }
                  toast.info(`Password reset link sent to ${email}`); 
                }}
                disabled={submitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-submit-btn form-submit-btn"
              disabled={submitting || emailError || passwordError}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="form-spinner" />
                  Signing in…
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Create Account CTA */}
          <p className="login-create-account">
            Don't have an account? <Link to="/create-account" className="create-link">Create Account</Link> and Be Part of the Family!
          </p>
        </div>
      </div>
    </div>
  );
}
