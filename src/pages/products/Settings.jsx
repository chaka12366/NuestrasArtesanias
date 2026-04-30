import { useState, useEffect } from "react";
import { Check, Bell, AlertCircle, Loader, Store, Lock, Eye, EyeOff, Key } from "lucide-react";
import { fetchStoreSettings, updateStoreSettings } from "../../lib/dashboard.js";
import { invalidateStoreSettings } from "../../utils/storeSettingsCache.js";
import { supabase } from "../../lib/supabase.js";
import { toast } from "react-toastify";
import "./AdminPages.css";

export default function Settings() {
  const [store, setStore] = useState({
    name: "Nuestras Artesanías",
    email: "nuestrasartesanias@gmail.com",
    phone: "+501 600-0000",
    address: "Corozal Town, Belize",
    whatsapp: "+501-555-0000",
    instagram: "@_nuestrasartesanias_",
    currency: "BZD",
    tagline: "Handcrafted & Authentic",
    shipping_zones: "Countrywide",
  });

  const [notifs, setNotifs] = useState({
    newOrder: true,
    lowStock: true,
    newReview: false,
    dailyReport: true,
  });

  const [password, setPassword] = useState({ current:"", next:"", confirm:"" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const settings = await fetchStoreSettings();
        if (settings) {
          setStore(settings);

          localStorage.setItem("storeSettings", JSON.stringify(settings));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Could not load settings. Using cached version.');

        const cached = localStorage.getItem("storeSettings");
        if (cached) {
          setStore(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const result = await updateStoreSettings({
        ...store,
      });

      if (result.success) {
        const fullSettings = {
          ...store,
        };

        localStorage.setItem("storeSettings", JSON.stringify(fullSettings));
        invalidateStoreSettings();

        setSaved(true);
        toast.success("Profile updated successfully");
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {

    setPasswordError("");

    if (!password.current || !password.next || !password.confirm) {
      setPasswordError("All fields are required");
      return;
    }

    if (password.next.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (password.next !== password.confirm) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      setPasswordLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: password.next
      });

      if (updateError) {
        setPasswordError(updateError.message || "Failed to update password");
        toast.error(updateError.message || "Failed to update password");
      } else {
        setPassword({ current: "", next: "", confirm: "" });
        toast.success("Password updated successfully!");
      }
    } catch (err) {
      console.error('Password update error:', err);
      setPasswordError("An error occurred while updating password");
      toast.error("An error occurred while updating password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const PasswordInput = ({ label, field }) => (
    <div className="ap-field">
      <label className="ap-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="ap-input"
          type={showPasswords[field] ? "text" : "password"}
          value={password[field] || ""}
          onChange={e => setPassword({...password, [field]: e.target.value})}
          onKeyDown={e => e.stopPropagation()}
          placeholder="••••••••"
          style={{ paddingRight: '2.5rem', width: '100%' }}
        />
        <button
          type="button"
          tabIndex="-1"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setShowPasswords({...showPasswords, [field]: !showPasswords[field]})}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            pointerEvents: 'auto',
          }}
        >
          {showPasswords[field] ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <button className={`ap-toggle ${checked?"on":""}`} onClick={()=>onChange(!checked)}>
      <span className="ap-toggle-thumb"/>
    </button>
  );

  return (
    <div className="ap-root">

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <span style={{ color: '#dc2626' }}>{error}</span>
        </div>
      )}

      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Settings</h1>
          <p className="ap-page-sub">Configure your store</p>
        </div>
        <button
          className={`ap-primary-btn ${saved?"saved":""}`}
          onClick={handleSave}
          disabled={loading || saving}
          style={{
            opacity: loading || saving ? 0.6 : 1,
            cursor: loading || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving && <Loader size={14} style={{display:'inline',marginRight:4, animation: 'spin 1s linear infinite'}} />}
          {saved ? <><Check size={14} style={{display:'inline',marginRight:4}} /> Saved!</> : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="ap-settings-grid">

        {}
        <div className="ap-card ap-settings-card">
          <div className="ap-settings-card-header">
            <Store size={24} className="ap-settings-icon" />
            <h3>Store Information</h3>
          </div>
          {[
            { label:"Store Name",   key:"name"     },
            { label:"Email",        key:"email"    },
            { label:"Phone",        key:"phone"    },
            { label:"WhatsApp",     key:"whatsapp" },
            { label:"Instagram",    key:"instagram" },
            { label:"Address",      key:"address"  },
            { label:"Tagline",      key:"tagline"  },
          ].map(f=>(
            <div key={f.key} className="ap-field">
              <label className="ap-label">{f.label}</label>
              <input className="ap-input" value={store[f.key]}
                onChange={e=>setStore({...store,[f.key]:e.target.value})}/>
            </div>
          ))}

        </div>

        {}
        <div className="ap-card ap-settings-card">
          <div className="ap-settings-card-header">
            <Lock size={24} className="ap-settings-icon" />
            <h3>Security</h3>
          </div>
          <div className="ap-field">
            <label className="ap-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="ap-input"
                type={showPasswords.current ? "text" : "password"}
                value={password.current || ""}
                onChange={e => setPassword({...password, current: e.target.value})}
                placeholder="••••••••"
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  pointerEvents: 'auto',
                }}
              >
                {showPasswords.current ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="ap-field">
            <label className="ap-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="ap-input"
                type={showPasswords.next ? "text" : "password"}
                value={password.next || ""}
                onChange={e => setPassword({...password, next: e.target.value})}
                placeholder="••••••••"
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, next: !showPasswords.next})}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  pointerEvents: 'auto',
                }}
              >
                {showPasswords.next ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="ap-field">
            <label className="ap-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="ap-input"
                type={showPasswords.confirm ? "text" : "password"}
                value={password.confirm || ""}
                onChange={e => setPassword({...password, confirm: e.target.value})}
                placeholder="••••••••"
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  pointerEvents: 'auto',
                }}
              >
                {showPasswords.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {passwordError && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <button
            className="ap-primary-btn"
            style={{marginTop:"0.5rem"}}
            onClick={handleUpdatePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <><Loader size={14} style={{display:'inline', marginRight: 6, animation: 'spin 1s linear infinite'}} /> Updating...</>
            ) : (
              <><Key size={14} style={{display:'inline', marginRight: 6}} /> Update Password</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}