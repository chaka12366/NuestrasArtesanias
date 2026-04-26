import { useState, useEffect } from "react";
import { Check, Bell, AlertCircle, Loader, Store, Palette, Lock } from "lucide-react";
import { fetchStoreSettings, updateStoreSettings } from "../../lib/dashboard.js";
import { invalidateStoreSettings } from "../../utils/storeSettingsCache.js";
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

  const [appearance, setAppearance] = useState({
    theme: "warm",
    showTopbar: true,
    showRatings: true,
    cardStyle: "rounded",
  });

  const [password, setPassword] = useState({ current:"", next:"", confirm:"" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const settings = await fetchStoreSettings();
        if (settings) {
          setStore(settings);
          setAppearance({
            theme: settings.theme || "warm",
            cardStyle: settings.cardStyle || "rounded",
            showTopbar: settings.showTopbar === 'true',
            showRatings: settings.showRatings === 'true',
          });
          // Also save to localStorage as backup
          localStorage.setItem("storeSettings", JSON.stringify(settings));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Could not load settings. Using cached version.');
        // Fall back to localStorage
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
        theme: appearance.theme,
        cardStyle: appearance.cardStyle,
        showTopbar: appearance.showTopbar.toString(),
        showRatings: appearance.showRatings.toString(),
      });

      if (result.success) {
        const fullSettings = {
          ...store,
          theme: appearance.theme,
          cardStyle: appearance.cardStyle,
          showTopbar: appearance.showTopbar.toString(),
          showRatings: appearance.showRatings.toString(),
        };
        // Also save to localStorage as backup
        localStorage.setItem("storeSettings", JSON.stringify(fullSettings));
        invalidateStoreSettings(); // Refresh global cache
        
        // Apply instantly
        document.documentElement.setAttribute('data-theme', appearance.theme);
        document.documentElement.setAttribute('data-style', appearance.cardStyle);

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

        {/* Store Info */}
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

        {/* Appearance */}
        <div className="ap-card ap-settings-card">
          <div className="ap-settings-card-header">
            <Palette size={24} className="ap-settings-icon" />
            <h3>Appearance</h3>
          </div>

          <div className="ap-field">
            <label className="ap-label">Color Theme</label>
            <div className="ap-theme-row">
              {[
                { key:"warm",   label:"Warm",   color:"#8b4513" },
                { key:"earth",  label:"Earth",  color:"#5c4033" },
                { key:"forest", label:"Forest", color:"#2d5a27" },
              ].map(t=>(
                <button key={t.key}
                  className={`ap-theme-btn ${appearance.theme===t.key?"active":""}`}
                  style={{"--tc":t.color}}
                  onClick={() => {
                    setAppearance({...appearance,theme:t.key});
                    document.documentElement.setAttribute('data-theme', t.key);
                  }}>
                  <span className="ap-theme-swatch"/>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ap-field" style={{ marginBottom: 0 }}>
            <label className="ap-label">Card Style</label>
            <div className="ap-cat-tabs">
              {["rounded","sharp","pill"].map(s=>(
                <button key={s} className={`ap-range-tab ${appearance.cardStyle===s?"active":""}`}
                  onClick={() => {
                    setAppearance({...appearance,cardStyle:s});
                    document.documentElement.setAttribute('data-style', s);
                  }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="ap-card ap-settings-card">
          <div className="ap-settings-card-header">
            <Lock size={24} className="ap-settings-icon" />
            <h3>Security</h3>
          </div>
          {[
            { label:"Current Password", key:"current", type:"password" },
            { label:"New Password",     key:"next",    type:"password" },
            { label:"Confirm Password", key:"confirm", type:"password" },
          ].map(f=>(
            <div key={f.key} className="ap-field">
              <label className="ap-label">{f.label}</label>
              <input className="ap-input" type={f.type}
                value={password[f.key]}
                onChange={e=>setPassword({...password,[f.key]:e.target.value})}
                placeholder="••••••••"
              />
            </div>
          ))}
          <button className="ap-primary-btn" style={{marginTop:"0.5rem"}}
            onClick={()=>{
              setPassword({current:"",next:"",confirm:""});
              toast.success("Password changed successfully");
            }}>
            Update Password
          </button>

          <div className="ap-danger-zone">
            <h4>Danger Zone</h4>
            <p>Permanently delete your store and all data.</p>
            <button className="ap-danger-btn">Delete Store</button>
          </div>
        </div>

      </div>
    </div>
  );
}