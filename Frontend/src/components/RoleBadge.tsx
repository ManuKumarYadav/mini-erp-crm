import React, { useState, useRef, useEffect } from "react";

interface RoleBadgeProps {
  user: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  onLogout: () => void;
}

const roleConfigs: Record<
  string,
  {
    label: string;
    icon: string;
    gradient: string;
    accent: string;
    pillBg: string;
    pillBorder: string;
    tag: string;
    description: string;
    features: { title: string; allowed: boolean }[];
  }
> = {
  ADMIN: {
    label: "Administrator",
    icon: "👑",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    accent: "#818cf8",
    pillBg: "rgba(99, 102, 241, 0.15)",
    pillBorder: "rgba(129, 140, 248, 0.4)",
    tag: "Super Admin",
    description: "Full system access, analytics & management",
    features: [
      { title: "Dashboard & Key Metrics", allowed: true },
      { title: "Customer & Lead Management", allowed: true },
      { title: "Product Catalog & Pricing", allowed: true },
      { title: "Sales & Invoicing", allowed: true },
      { title: "Orders Management & Dispatch", allowed: true },
      { title: "Reports & Financial Intelligence", allowed: true },
    ],
  },
  SALES: {
    label: "Sales Staff",
    icon: "💼",
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    accent: "#38bdf8",
    pillBg: "rgba(14, 165, 233, 0.15)",
    pillBorder: "rgba(56, 189, 248, 0.4)",
    tag: "CRM & Sales",
    description: "Lead generation, customer support & order booking",
    features: [
      { title: "Dashboard Overview", allowed: true },
      { title: "Customer & Lead Management", allowed: true },
      { title: "Browse Products & Check Stock", allowed: true },
      { title: "Create New Sales & Invoices", allowed: true },
      { title: "Order Dispatch Approval", allowed: false },
      { title: "Executive Financial Reports", allowed: false },
    ],
  },
  WAREHOUSE: {
    label: "Warehouse Staff",
    icon: "📦",
    gradient: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
    accent: "#fbbf24",
    pillBg: "rgba(245, 158, 11, 0.15)",
    pillBorder: "rgba(251, 191, 36, 0.4)",
    tag: "Inventory Operations",
    description: "Stock counting, dispatch confirmation & intake",
    features: [
      { title: "Dashboard Overview", allowed: true },
      { title: "Inventory & Stock Adjustments", allowed: true },
      { title: "Orders Verification & Dispatch", allowed: true },
      { title: "Customer Lead Management", allowed: false },
      { title: "Executive Financial Reports", allowed: false },
    ],
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleKey = user?.role?.toUpperCase() || "ADMIN";
  const config = roleConfigs[roleKey] || roleConfigs.ADMIN;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="role-badge-container" ref={dropdownRef}>
      <button
        type="button"
        className="role-pill-button"
        style={{
          background: config.pillBg,
          borderColor: config.pillBorder,
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="View Role & Permissions Profile"
      >
        <span className="role-avatar-circle" style={{ background: config.gradient }}>
          {config.icon}
        </span>
        <div className="role-text-column">
          <span className="role-user-name">{user?.name || user?.email?.split("@")[0] || "User"}</span>
          <span className="role-pill-tag" style={{ color: config.accent }}>
            {config.label}
          </span>
        </div>
        <span className={`role-chevron ${isOpen ? "open" : ""}`}>▾</span>
      </button>

      {isOpen && (
        <div className="role-popup-dropdown">
          <div className="role-popup-header" style={{ background: config.gradient }}>
            <div className="popup-user-avatar">{config.icon}</div>
            <div className="popup-user-meta">
              <h3>{user?.name || "Team Member"}</h3>
              <p>{user?.email}</p>
              <span className="popup-role-pill">{config.label} • {config.tag}</span>
            </div>
          </div>

          <div className="role-popup-body">
            <p className="role-desc-text">{config.description}</p>

            <div className="permissions-checklist">
              <span className="checklist-title">Access Privileges:</span>
              {config.features.map((feat, i) => (
                <div
                  key={i}
                  className={`permission-item ${feat.allowed ? "allowed" : "restricted"}`}
                >
                  <span className="status-symbol">
                    {feat.allowed ? "✓" : "🔒"}
                  </span>
                  <span className="feature-label">{feat.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="role-popup-footer">
            <button
              type="button"
              className="btn-popup-logout"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBadge;
