import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import "./AdminPages.css";
import EmptyState from "../../components/EmptyState.jsx";
import { Search, Mail, Phone, ShoppingBag, DollarSign, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "react-toastify";
import { useDebounce } from "../../utils/useDebounce.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState("orders");

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, phone, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, customer_id, city, district");

      if (ordersError) throw ordersError;

      const orderStats = {};
      const customerLocation = {};
      (orders || []).forEach((order) => {
        const customerId = order.customer_id;
        if (!customerId) return;

        if (!orderStats[customerId]) {
          orderStats[customerId] = { count: 0, total: 0 };
        }
        orderStats[customerId].count += 1;
        orderStats[customerId].total += Number(order.total) || 0;

        if (!customerLocation[customerId]) {
          customerLocation[customerId] = {
            city: order.city,
            district: order.district,
          };
        }
      });

      const enrichedCustomers = (profiles || []).map((profile) => {
        const stats = orderStats[profile.id] || { count: 0, total: 0 };
        const location = customerLocation[profile.id];
        return {
          id: profile.id,
          email: profile.email,
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown",
          phone: profile.phone || "—",
          village: location?.city || "—",
          district: location?.district || "—",
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

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "spent") {
      return b.spent - a.spent;
    }
    return b.orders - a.orders;
  });

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
    <div className="ap-root">
      {}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Customers</h1>
          <p className="ap-page-sub">Manage and view all customer information</p>
        </div>
      </div>

      {}
      <div className="ap-filters">
        <div className="ap-search-wrapper">
          <Search className="ap-search-icon" size={16} />
          <input
            className="ap-search"
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ap-cat-tabs">
          <button
            className={`ap-range-tab ${sortBy === "orders" ? "active" : ""}`}
            onClick={() => setSortBy("orders")}
          >
            Sort by Orders
          </button>
          <button
            className={`ap-range-tab ${sortBy === "spent" ? "active" : ""}`}
            onClick={() => setSortBy("spent")}
          >
            Sort by Spent
          </button>
        </div>
      </div>

      {}
      <div className="ap-customers-list">
        {sortedCustomers.length === 0 ? (
          <EmptyState
            title="No Customers Yet"
            description="Your customers will appear here once they start placing orders."
            type="orders"
            compact={true}
          />
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

              {}
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
                    <span className="ap-detail-label">Village:</span>
                    <span className="ap-detail-value">{customer.village}</span>
                  </div>

                  <div className="ap-detail-row">
                    <span className="ap-detail-label">District:</span>
                    <span className="ap-detail-value">{customer.district}</span>
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

                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
