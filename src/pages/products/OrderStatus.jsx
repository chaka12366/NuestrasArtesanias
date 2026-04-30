import { useState } from "react";
import { Clock, Truck, CheckCircle2, Lock } from "lucide-react";
import "./OrderStatus.css";

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

const STATUS_FLOW = ["pending", "in-progress", "ready", "delivered"];

export default function OrderStatus({ currentStatus, orderId, onStatusChange, paymentStatus = 'unpaid', isCompact = false }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || isLoading) return;

    setIsLoading(true);
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
        paymentStatus={paymentStatus}
      />
    );
  }

  return (
    <OrderStatusHorizontal
      currentStatus={currentStatus}
      orderId={orderId}
      onStatusChange={handleStatusChange}
      isLoading={isLoading}
      paymentStatus={paymentStatus}
    />
  );
}

function OrderStatusHorizontal({ currentStatus, orderId, onStatusChange, isLoading, paymentStatus }) {
  const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatusIndex = currentStatusIndex + 1;
  const isUnpaid = paymentStatus !== 'paid';

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

          const isDeliveryBlocked = status === 'delivered' && isUnpaid && isNext;
          const isDisabled = isLoading || isDeliveryBlocked || (!isActive && !isNext);

          let title = config.description;
          if (isDeliveryBlocked) {
            title = '🔒 Order must be paid before delivery';
          } else if (isFuture && !isNext) {
            title = `Complete "${STATUS_FLOW[nextStatusIndex]}" first`;
          }

          return (
            <button
              key={status}
              className={`order-status-btn ${isActive ? "active" : ""} ${isPast ? "past" : ""} ${isNext && !isDeliveryBlocked ? "next" : ""} ${isFuture && !isNext ? "disabled-future" : ""} ${isDeliveryBlocked ? "blocked" : ""}`}
              onClick={() => onStatusChange(status)}
              disabled={isDisabled}
              title={title}
              style={{ "--status-color": config.color }}
            >
              {isDeliveryBlocked ? <Lock size={14} className="order-status-icon" /> : <Icon size={16} className="order-status-icon" />}
              <span className="order-status-label">{config.label}</span>
            </button>
          );
        })}
      </div>
      <div className="order-status-indicator">
        <span className="order-status-current">{STATUS_CONFIG[currentStatus].label}</span>
        {nextStatusIndex < STATUS_FLOW.length && (
          STATUS_FLOW[nextStatusIndex] === 'delivered' && isUnpaid ? (
            <span className="order-status-blocked-hint">
              <Lock size={11} /> Must be paid first
            </span>
          ) : (
            <span className="order-status-next-hint">→ Next: {STATUS_CONFIG[STATUS_FLOW[nextStatusIndex]].label}</span>
          )
        )}
      </div>
    </div>
  );
}

function OrderStatusCompact({ currentStatus, orderId, onStatusChange, isLoading, paymentStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = STATUS_CONFIG[currentStatus];
  const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatusIndex = currentStatusIndex + 1;
  const canProgress = nextStatusIndex < STATUS_FLOW.length;
  const nextStatus = canProgress ? STATUS_FLOW[nextStatusIndex] : null;
  const isUnpaid = paymentStatus !== 'paid';
  const isDeliveryBlocked = nextStatus === 'delivered' && isUnpaid;

  const CurrentIcon = currentConfig.icon;
  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;
  const NextIcon = nextConfig ? nextConfig.icon : null;

  return (
    <div className="order-status-compact">
      <button
        className="order-status-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !canProgress}
        title={!canProgress ? "Order is already delivered" : isDeliveryBlocked ? "Must be paid before delivery" : "Change order status"}
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
          {isDeliveryBlocked ? (
            <div className="order-status-dropdown-blocked">
              <Lock size={12} />
              <span>Order must be paid before delivery</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
