import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import "./AdminPages.css";
import { Search, Mail, Phone, ShoppingBag, DollarSign, ChevronDown, ChevronUp, Key, Copy } from "lucide-react";
import { toast } from "react-toastify";
import { useDebounce } from "../../utils/useDebounce.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState("orders"); // "orders" or "spent"
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch all customers with their order statistics
  useEffect(() => {
    setLoading(true);
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      // Get all profiles that are customers (role = 'customer')
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, phone, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all orders to aggregate stats per customer
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, customer_id");

      if (ordersError) throw ordersError;

      // Aggregate order stats by customer ID
      const orderStats = {};
      (orders || []).forEach((order) => {
        const customerId = order.customer_id;
        if (!customerId) return;
        if (!orderStats[customerId]) {
          orderStats[customerId] = { count: 0, total: 0 };
        }
        orderStats[customerId].count += 1;
        orderStats[customerId].total += Number(order.total) || 0;
      });

      // Combine customer data with order stats
      const enrichedCustomers = (profiles || []).map((profile) => {
        const stats = orderStats[profile.id] || { count: 0, total: 0 };
        return {
          id: profile.id,
          email: profile.email,
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown",
          phone: profile.phone || "—",
          orders: stats.count,
          spent: stats.total,
          joinedDate: new Date(profile.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        };
      });

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  // Filter customers by search
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "spent") {
      return b.spent - a.spent;
    }
    return b.orders - a.orders;
  });

  // Handle password reset email
  const handleSendResetLink = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter a valid email");
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

      if (error) throw error;

      toast.success(`Password reset link sent to ${resetEmail}`);
      setResetEmail("");
      setShowResetModal(false);
    } catch (error) {
      console.error("Error sending reset link:", error);
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="ap-page">
        <div className="ap-loading">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-header">
        <h1>Customers</h1>
        <p className="ap-header-desc">Manage and view all customer information</p>
      </div>

      {/* Controls */}
      <div className="ap-controls">
        <div className="ap-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="ap-btn ap-btn-primary"
          onClick={() => setShowResetModal(true)}
          title="Send password reset link"
        >
          <Key size={18} />
          Reset Password
        </button>
      </div>

      {/* Sort buttons */}
      <div className="ap-sort-controls">
        <button
          className={`ap-sort-btn ${sortBy === "orders" ? "active" : ""}`}
          onClick={() => setSortBy("orders")}
        >
          Sort by Orders
        </button>
        <button
          className={`ap-sort-btn ${sortBy === "spent" ? "active" : ""}`}
          onClick={() => setSortBy("spent")}
        >
          Sort by Spent
        </button>
      </div>

      {/* Customers List */}
      <div className="ap-customers-list">
        {sortedCustomers.length === 0 ? (
          <div className="ap-empty-state">
            <ShoppingBag size={48} opacity={0.3} />
            <p>No customers found</p>
          </div>
        ) : (
          sortedCustomers.map((customer) => (
            <div key={customer.id} className="ap-customer-card">
              <div
                className="ap-customer-header"
                onClick={() =>
                  setExpanded(expanded === customer.id ? null : customer.id)
                }
              >
                <div className="ap-customer-info">
                  <div className="ap-customer-name">{customer.name}</div>
                  <div className="ap-customer-email">{customer.email}</div>
                </div>

                <div className="ap-customer-stats">
                  <div className="ap-stat-item">
                    <ShoppingBag size={16} />
                    <span>{customer.orders}</span>
                  </div>
                  <div className="ap-stat-item">
                    <DollarSign size={16} />
                    <span>${customer.spent.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="ap-expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(expanded === customer.id ? null : customer.id);
                  }}
                >
                  {expanded === customer.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {/* Expanded details */}
              {expanded === customer.id && (
                <div className="ap-customer-details">
                  <div className="ap-detail-row">
                    <span className="ap-detail-label">Email:</span>
                    <div className="ap-detail-value-with-copy">
                      {customer.email}
                      <button
                        className="ap-copy-btn"
                        onClick={() => copyToClipboard(customer.email)}
                        title="Copy email"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="ap-detail-row">
                    <span className="ap-detail-label">Phone:</span>
                    <div className="ap-detail-value-with-copy">
                      {customer.phone}
                      {customer.phone !== "—" && (
                        <button
                          className="ap-copy-btn"
                          onClick={() => copyToClipboard(customer.phone)}
                          title="Copy phone"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="ap-detail-row">
                    <span className="ap-detail-label">Joined:</span>
                    <span className="ap-detail-value">{customer.joinedDate}</span>
                  </div>

                  <div className="ap-detail-row">
                    <span className="ap-detail-label">Total Orders:</span>
                    <span className="ap-detail-value">{customer.orders}</span>
                  </div>

                  <div className="ap-detail-row">
                    <span className="ap-detail-label">Total Spent:</span>
                    <span className="ap-detail-value">
                      ${customer.spent.toFixed(2)}
                    </span>
                  </div>

                  <div className="ap-detail-actions">
                    <button
                      className="ap-detail-btn ap-detail-btn-reset"
                      onClick={() => {
                        setResetEmail(customer.email);
                        setShowResetModal(true);
                      }}
                    >
                      <Key size={16} />
                      Send Password Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="ap-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Send Password Reset Link</h2>
            <p className="ap-modal-desc">
              Enter the customer email address to send them a password reset link.
            </p>

            <input
              type="email"
              className="ap-input"
              placeholder="customer@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetting}
            />

            <div className="ap-modal-actions">
              <button
                className="ap-btn ap-btn-secondary"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                className="ap-btn ap-btn-primary"
                onClick={handleSendResetLink}
                disabled={resetting}
              >
                {resetting ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
