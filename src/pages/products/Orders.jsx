import { useState, useMemo, useEffect } from "react";
import "./AdminPages.css";
import OrderStatus from "./OrderStatus.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { fetchAllOrders, updateOrderStatus, cancelOrder } from "../../lib/dashboard.js";
import { updatePaymentStatus } from "../../lib/orders.js";
import { sendCustomerStatusEmail } from "../../lib/emailNotification.js";
import { Clock, Truck, CheckCircle2, DollarSign, MapPin, ChevronUp, ChevronDown, X, AlertCircle, Trash2, MessageCircle } from "lucide-react";
import { validatePhone, getWhatsAppLink, generateOrderMessage } from "../../lib/whatsapp.js";
import { toast } from "react-toastify";
import { useDebounce } from "../../utils/useDebounce.js";

const STATUS_FLOW = ["pending", "in-progress", "ready", "delivered"];

const statusColor = { pending: "#f39c12", "in-progress": "#e67e22", ready: "#2980b9", delivered: "#27ae60" };

const getStatusIcon = (status) => {
  const iconProps = { size: 18, strokeWidth: 2 };
  switch (status) {
    case "pending": return <Clock {...iconProps} color={statusColor.pending} />;
    case "in-progress": return <Clock {...iconProps} color={statusColor["in-progress"]} />;
    case "ready": return <Truck {...iconProps} color={statusColor.ready} />;
    case "delivered": return <CheckCircle2 {...iconProps} color={statusColor.delivered} />;
    default: return null;
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch real orders from Supabase on component mount
  useEffect(() => {
    setLoading(true);
    fetchAllOrders().then(data => {
      // Transform Supabase data to match UI format
      const transformedOrders = data.map(order => {
        const customerName = order.profiles
          ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim()
          : (order.guest_name || 'Guest');
        const customerEmail = order.profiles?.email || order.guest_email || '';
        const customerPhone = order.profiles?.phone || order.guest_phone || 'N/A';

        const itemsQty = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const allItemsStr = order.order_items?.map(i => i.product_name).join(", ") || 'Order';
        const itemsDetailStr = order.order_items?.map(i => `${i.product_name} ×${i.quantity}`).join(", ") || 'Order';

        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        return {
          id: order.id,
          customer: customerName,
          email: customerEmail,
          phone: customerPhone,
          item: allItemsStr,
          itemsDetail: itemsDetailStr,
          qty: itemsQty,
          total: Number(order.total) || 0,
          status: order.status || 'pending',
          paymentStatus: order.payment_status || 'unpaid',
          date: formattedDate,
          district: order.district || 'N/A',
          city: order.city || 'N/A',
          notes: order.delivery_notes || "",
        };
      });
      setOrders(transformedOrders);
      setLoading(false);
    }).catch(error => {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    });
  }, []);

  /* ── Status Update Handler ── */
  const handleStatusChange = async (orderId, newStatus) => {
    // Get the order to validate status flow
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Validate that new status follows the sequence
    const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
    const newStatusIndex = STATUS_FLOW.indexOf(newStatus);

    // Only allow moving to the next status in the flow
    if (newStatusIndex !== currentStatusIndex + 1) {
      const nextStatus = STATUS_FLOW[currentStatusIndex + 1];
      toast.error(`You must complete "${nextStatus}" before proceeding.`);
      return;
    }

    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order status updated to ${newStatus}`);
      
      // Send email notification for specific statuses
      if (newStatus === "in-progress" || newStatus === "ready" || newStatus === "delivered") {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (orderToUpdate && orderToUpdate.email) {
          // Map statuses to match emailNotification.js types
          let emailStatus = newStatus;
          if (newStatus === "in-progress") emailStatus = "processing";
          if (newStatus === "delivered") emailStatus = "delivery";
          
          try {
            await sendCustomerStatusEmail(emailStatus, {
              customer_name: orderToUpdate.customer,
              customer_email: orderToUpdate.email,
              order_id: orderToUpdate.id,
              order_date: orderToUpdate.date,
              order_items: orderToUpdate.itemsDetail,
              order_total: `$${Number(orderToUpdate.total).toFixed(2)} BZD`,
              delivery_method: orderToUpdate.city !== 'N/A' && orderToUpdate.city ? `Delivery to ${orderToUpdate.city}, ${orderToUpdate.district}` : 'Pickup'
            });
          } catch (error) {
            console.error("Failed to send status update email:", error);
          }
        }
      }
    } else {
      console.error('Failed to update order status');
      toast.error('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    const success = await updatePaymentStatus(orderId, newStatus);
    if (success) {
      setOrders(os => os.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o));
      toast.success(`Payment status updated to ${newStatus}`);
    } else {
      toast.error('Failed to update payment status');
    }
  };

  /* ── Cancel Order Handler ── */
  const handleCancelOrder = async (orderId) => {
    setCancelling(true);2
    const result = await cancelOrder(orderId);
    setCancelling(false);

    if (result.success) {
      // Update orders list
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setCancelConfirm(null);
      toast.success(`✓ Order ${orderId} cancelled. Stock restored for ${result.restoredItems || 0} product(s).`);
    } else {
      toast.error(`✗ Failed to cancel order: ${result.message}`);
    }
  };

  const showCancelConfirm = (orderId) => {
    setCancelConfirm(orderId);
  };

  const closeCancelConfirm = () => {
    setCancelConfirm(null);
  };

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() =>
    orders.filter(o =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (o.customer.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        o.id.includes(debouncedSearch) || o.item.toLowerCase().includes(debouncedSearch.toLowerCase()))
    ), [orders, statusFilter, debouncedSearch]);

  const totalRev = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === "pending").length;
  const inProgress = orders.filter(o => o.status === "in-progress").length;
  const ready = orders.filter(o => o.status === "ready").length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;



  return (
    <div className="ap-root">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Orders</h1>
          <p className="ap-page-sub">{orders.length} total · BZD ${totalRev} revenue</p>
        </div>
      </div>

      {/* Order KPIs */}
      <div className="ap-kpi-row ap-order-kpi-row">
        {[
          { Icon: Clock, label: "Pending", val: pending, color: "#f39c12" },
          { Icon: Clock, label: "In Progress", val: inProgress, color: "#e67e22" },
          { Icon: Truck, label: "Ready", val: ready, color: "#2980b9" },
          { Icon: CheckCircle2, label: "Delivered", val: delivered, color: "#27ae60" },
          { Icon: X, label: "Cancelled", val: cancelled, color: "#e74c3c" },
          { Icon: DollarSign, label: "Revenue", val: `$${totalRev}`, color: "#8b4513" },
        ].map((k, i) => (
          <div key={i} className="ap-kpi-card" style={{ "--i": i, "--accent": k.color }}>
            <div className="ap-kpi-icon"><k.Icon size={24} color={k.color} /></div>
            <div className="ap-kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="ap-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ap-filters">
        <input className="ap-search" placeholder="Search order, customer, item…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="ap-cat-tabs">
          {["all", "pending", "in-progress", "ready", "delivered", "cancelled"].map(s => (
            <button key={s} className={`ap-range-tab ${statusFilter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="ap-orders-list">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={`skel-${i}`} className="ap-order-card skeleton" style={{ height: "72px", marginBottom: "12px", borderRadius: "12px" }}></div>
          ))
        ) : filtered.map((o, i) => (
          <div key={o.id} className={`ap-order-card ${expanded === o.id ? "exp" : ""} ${o.status === 'cancelled' ? 'cancelled' : ''}`} style={{ "--i": i }}>
            <div className="ap-order-main" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div className="ap-order-id-col">
                <span className="ap-order-id">{o.id}</span>
                <span className="ap-order-date">{o.date}</span>
              </div>
              <div className="ap-order-customer">
                <div className="ap-cust-avatar">{o.customer[0]}</div>
                <div>
                  <p className="ap-cust-name">{o.customer}</p>
                  <p className="ap-cust-city"><MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> {o.city}, {o.district}</p>
                </div>
              </div>
              <div className="ap-order-item">
                <p className="ap-order-item-name">{o.item}</p>
                <p className="ap-order-qty">×{o.qty}</p>
              </div>
              <span className="ap-order-total">${o.total}</span>
              <div className="ap-order-badges" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="ap-status-badge" style={{ "--sc": o.paymentStatus === 'paid' ? '#27ae60' : '#c0392b' }}>
                  {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
                <span className={`ap-status-badge status-${o.status}`} style={{ "--sc": statusColor[o.status] }}>
                  {getStatusIcon(o.status)} <span style={{textTransform: 'capitalize'}}>{o.status}</span>
                </span>
              </div>
              <span className="ap-expand-chevron">{expanded === o.id ? <ChevronUp size={16} style={{ display: 'inline' }} /> : <ChevronDown size={16} style={{ display: 'inline' }} />}</span>
            </div>

            {expanded === o.id && (
              <div className="ap-order-detail">
                <div className="ap-order-detail-grid">
                  {/* Left Column: Info & Details */}
                  <div className="ap-order-section">
                    <h4 className="ap-section-title">Customer Info</h4>
                    <div className="ap-info-row">
                      <span className="ap-info-label">Email:</span>
                      <span className="ap-info-value">{o.email}</span>
                    </div>
                    <div className="ap-info-row">
                      <span className="ap-info-label">Phone:</span>
                      <div className="ap-phone-wrap">
                        <span className="ap-info-value">{o.phone}</span>
                        {(() => {
                          const isValid = validatePhone(o.phone);
                          const msg = generateOrderMessage(o.customer, o.id, o.status, o.itemsDetail, o.total);
                          const link = isValid ? getWhatsAppLink(o.phone, msg) : null;
                          return (
                            <a href={link || "#"} target={isValid ? "_blank" : undefined} rel={isValid ? "noopener noreferrer" : undefined} onClick={(e) => { e.stopPropagation(); if (!isValid) e.preventDefault(); }} className={`ap-wa-btn ${isValid ? 'valid' : 'invalid'}`} title={isValid ? "Send WhatsApp Message" : "Invalid Phone Number"}>
                              <MessageCircle size={14} />
                              <span>WhatsApp</span>
                            </a>
                          );
                        })()}
                      </div>
                    </div>

                    <h4 className="ap-section-title" style={{ marginTop: '1.25rem' }}>Delivery Location</h4>
                    <div className="ap-info-row">
                      <span className="ap-info-label">District:</span>
                      <span className="ap-info-value">{o.district}</span>
                    </div>
                    <div className="ap-info-row">
                      <span className="ap-info-label">City/Village:</span>
                      <span className="ap-info-value">{o.city}</span>
                    </div>

                    <h4 className="ap-section-title" style={{ marginTop: '1.25rem' }}>Order Details</h4>
                    <ul className="ap-item-list">
                      {o.itemsDetail.split(', ').map((item, idx) => (
                        <li key={idx} className="ap-item-list-li">• {item}</li>
                      ))}
                    </ul>
                    <div className="ap-total-box">
                      <span>Total:</span>
                      <strong>${Number(o.total).toFixed(2)} BZD</strong>
                    </div>
                    {o.notes && (
                      <div className="ap-notes-box">
                        <strong>Notes:</strong> {o.notes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="ap-order-section">
                    <h4 className="ap-section-title">Payment Status</h4>
                    <div className="ap-payment-toggle">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePaymentStatusChange(o.id, 'paid'); }}
                        className={`ap-pay-btn ${o.paymentStatus === 'paid' ? 'active-paid' : ''}`}
                      >
                        Paid
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePaymentStatusChange(o.id, 'unpaid'); }}
                        className={`ap-pay-btn ${o.paymentStatus === 'unpaid' ? 'active-unpaid' : ''}`}
                      >
                        Unpaid
                      </button>
                    </div>

                    <h4 className="ap-section-title" style={{ marginTop: '1.25rem' }}>Order Status</h4>
                    <div className="ap-status-wrapper">
                      <OrderStatus
                        currentStatus={o.status}
                        orderId={o.id}
                        onStatusChange={handleStatusChange}
                        isCompact={window.innerWidth <= 768}
                      />
                    </div>

                    {o.status !== 'cancelled' && (
                      <>
                        <hr className="ap-divider" />
                        <button
                          onClick={(e) => { e.stopPropagation(); showCancelConfirm(o.id); }}
                          className="ap-cancel-btn"
                        >
                          <Trash2 size={16} />
                          Cancel Order & Restore Stock
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <EmptyState
            title="No Orders"
            description={statusFilter === "all" && search === ""
              ? "No orders yet. Orders will appear here once customers start placing them."
              : "No orders match your search or filter. Try adjusting your search criteria."}
            type="orders"
            compact={true}
          />
        )}
      </div>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {cancelConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '24px',
            width: 'min(400px, 90vw)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            border: '1px solid #ede8e2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fdecea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color='#e74c3c' />
              </div>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: '#2a1810', margin: 0 }}>
                Cancel Order?
              </h3>
            </div>
            
            <p style={{ fontSize: 14, color: '#6b4423', marginBottom: 16, lineHeight: 1.5 }}>
              This will cancel the order <strong>{cancelConfirm}</strong> and restore all product stock. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={closeCancelConfirm}
                disabled={cancelling}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #ede8e2',
                  background: '#fff',
                  color: '#6b4423',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: cancelling ? 0.5 : 1,
                }}
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancelConfirm)}
                disabled={cancelling}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e74c3c',
                  background: '#e74c3c',
                  color: '#fff',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: cancelling ? 0.7 : 1,
                }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}



      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}