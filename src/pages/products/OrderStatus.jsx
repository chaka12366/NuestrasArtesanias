import { useState } from "react";
import { Clock, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import "./OrderStatus.css";

/* ── Status Configuration ── */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "#f39c12",
    description: "Waiting for confirmation",
    order: 0,
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    color: "#e67e22",
    description: "Being prepared",
    order: 1,
  },
  ready: {
    label: "Ready",
    icon: Truck,
    color: "#2980b9",
    description: "Ready for delivery",
    order: 2,
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "#27ae60",
    description: "Order completed",
    order: 3,
  },
};

/* ── Status Flow (for progression) ── */
const STATUS_FLOW = ["pending", "in-progress", "ready", "delivered"];

/**
 * Reusable OrderStatus Component
 * 
 * Props:
 * - currentStatus: string (pending, in-progress, ready, delivered)
 * - orderId: string (for identifying which order to update)
 * - onStatusChange: function(orderId, newStatus)
 * - isCompact: boolean (optional, for mobile view)
 */
export default function OrderStatus({ currentStatus, orderId, onStatusChange, isCompact = false }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || isLoading) return;

    setIsLoading(true);

    // TODO: Connect to API here in the future
    // Example structure:
    // try {
    //   const response = await fetch(`/api/orders/${orderId}/status`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ status: newStatus }),
    //   });
    //   if (response.ok) {
    //     onStatusChange(orderId, newStatus);
    //   } else {
    //     console.error("Failed to update status");
    //   }
    // } catch (error) {
    //   console.error("Error updating status:", error);
    // } finally {
    //   setIsLoading(false);
    // }

    // For now, update immediately (local state)
    onStatusChange(orderId, newStatus);
    setIsLoading(false);
  };

  if (isCompact) {
    return (
      <OrderStatusCompact
        currentStatus={currentStatus}
        orderId={orderId}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
      />
    );
  }

  return (
    <OrderStatusHorizontal
      currentStatus={currentStatus}
      orderId={orderId}
      onStatusChange={handleStatusChange}
      isLoading={isLoading}
    />
  );
}

/**
 * Horizontal status controls (Desktop view)
 */
function OrderStatusHorizontal({ currentStatus, orderId, onStatusChange, isLoading }) {
  const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatusIndex = currentStatusIndex + 1;
  
  return (
    <div className="order-status-container">
      <div className="order-status-group">
        {STATUS_FLOW.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isActive = status === currentStatus;
          const isPast = STATUS_FLOW.indexOf(status) < currentStatusIndex;
          const isNext = STATUS_FLOW.indexOf(status) === nextStatusIndex;
          const isFuture = STATUS_FLOW.indexOf(status) > currentStatusIndex;

          return (
            <button
              key={status}
              className={`order-status-btn ${isActive ? "active" : ""} ${isPast ? "past" : ""} ${isNext ? "next" : ""} ${isFuture && !isNext ? "disabled-future" : ""}`}
              onClick={() => onStatusChange(status)}
              disabled={isLoading || !isActive && !isNext}
              title={isFuture && !isNext ? `Complete "${STATUS_FLOW[nextStatusIndex]}" first` : config.description}
              style={{ "--status-color": config.color }}
            >
              <Icon size={16} className="order-status-icon" />
              <span className="order-status-label">{config.label}</span>
            </button>
          );
        })}
      </div>
      <div className="order-status-indicator">
        <span className="order-status-current">{STATUS_CONFIG[currentStatus].label}</span>
        {nextStatusIndex < STATUS_FLOW.length && (
          <span className="order-status-next-hint">→ Next: {STATUS_CONFIG[STATUS_FLOW[nextStatusIndex]].label}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact status controls (Mobile view / Dropdown)
 */
function OrderStatusCompact({ currentStatus, orderId, onStatusChange, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = STATUS_CONFIG[currentStatus];
  const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatusIndex = currentStatusIndex + 1;
  const canProgress = nextStatusIndex < STATUS_FLOW.length;
  const nextStatus = canProgress ? STATUS_FLOW[nextStatusIndex] : null;

  const CurrentIcon = currentConfig.icon;
  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;
  const NextIcon = nextConfig ? nextConfig.icon : null;

  return (
    <div className="order-status-compact">
      <button
        className="order-status-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !canProgress}
        title={!canProgress ? "Order is already delivered" : "Change order status"}
      >
        <CurrentIcon size={14} />
        <span>{currentConfig.label}</span>
        {canProgress && (
          <svg
            className={`order-status-chevron ${isOpen ? "open" : ""}`}
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {isOpen && canProgress && nextConfig && NextIcon && (
        <div className="order-status-dropdown-menu">
          <div className="order-status-dropdown-hint">
            Next step: {nextConfig.label}
          </div>
          <button
            className="order-status-dropdown-item"
            onClick={() => {
              onStatusChange(nextStatus);
              setIsOpen(false);
            }}
            disabled={isLoading}
          >
            <NextIcon size={14} color={nextConfig.color} />
            <span>{nextConfig.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
