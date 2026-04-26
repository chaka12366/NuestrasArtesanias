import { useState, useEffect } from "react";
import { Check, Bell, AlertCircle, Loader, Store, Lock } from "lucide-react";
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
      });

      if (result.success) {
        const fullSettings = {
          ...store,
        };
        // Also save to localStorage as backup
        localStorage.setItem("storeSettings", JSON.stringify(fullSettings));
        invalidateStoreSettings(); // Refresh global cache

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