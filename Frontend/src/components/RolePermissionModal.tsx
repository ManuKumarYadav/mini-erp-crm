import React from "react";

export interface RolePermissionModalProps {
  currentRole: string;
  userName?: string;
  requiredRole?: string;
  featureName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateHome?: () => void;
  onSwitchAccount?: () => void;
  isInline?: boolean; // if true, renders directly inside a page instead of an overlay
}

const roleDetails: Record<
  string,
  {
    name: string;
    icon: string;
    badgeColor: string;
    bgGradient: string;
    accentColor: string;
    permissions: string[];
    description: string;
  }
> = {
  ADMIN: {
    name: "Administrator",
    icon: "👑",
    badgeColor: "#6366f1",
    bgGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    accentColor: "#818cf8",
    permissions: [
      "Full CRM & Customer Management",
      "Product Catalog & Pricing Control",
      "Complete Sales & Challans Creation",
      "Orders & Dispatch Operations",
      "Executive Reports & Financial Analytics",
      "User & Team Role Administration",
    ],
    description: "Complete unrestricted access to all modules and reports.",
  },
  SALES: {
    name: "Sales Staff",
    icon: "💼",
    badgeColor: "#0ea5e9",
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    accentColor: "#38bdf8",
    permissions: [
      "Customer & Lead Management (CRM)",
      "View Products Catalog & Real-time Stock",
      "Create New Sales & Invoices",
      "Follow-up Date & Call Logging",
    ],
    description: "Authorized for Customer interactions, Product browsing, and Sales creation.",
  },
  WAREHOUSE: {
    name: "Warehouse Specialist",
    icon: "📦",
    badgeColor: "#f59e0b",
    bgGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    accentColor: "#fbbf24",
    permissions: [
      "Inventory Stock Tracking & Movements",
      "Add / Update Product Physical Stock",
      "Order Verification & Dispatch Confirmation",
    ],
    description: "Authorized for Inventory stock adjustments, Order confirmation, and Dispatch.",
  },
  ACCOUNTS: {
    name: "Accounts & Billing",
    icon: "📊",
    badgeColor: "#10b981",
    bgGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    accentColor: "#34d399",
    permissions: [
      "Invoice Generation & Challans",
      "Sales Summary & Revenue Views",
      "Customer Billing Details",
    ],
    description: "Authorized for financial invoices, payments, and receipts.",
  },
};

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  currentRole,
  userName = "User",
  requiredRole = "ADMIN",
  featureName = "Reports & Analytics",
  isOpen = true,
  onClose,
  onNavigateHome,
  onSwitchAccount,
  isInline = false,
}) => {
  if (!isOpen && !isInline) return null;

  const userRoleKey = currentRole?.toUpperCase() || "SALES";
  const userRoleInfo = roleDetails[userRoleKey] || {
    name: currentRole || "Staff",
    icon: "👤",
    badgeColor: "#64748b",
    bgGradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    accentColor: "#94a3b8",
    permissions: ["Standard operations"],
    description: "Standard team access.",
  };

  const reqRoleInfo = roleDetails[requiredRole] || roleDetails.ADMIN;

  const content = (
    <div className={`role-permission-card ${isInline ? "inline-mode" : "modal-mode"}`}>
      {/* Header Glow & Icon */}
      <div className="permission-header">
        <div className="lock-icon-glow">
          <div className="icon-ring">
            <span className="lock-emoji">🔒</span>
          </div>
        </div>

        <div className="badge-row">
          <span className="current-role-badge" style={{ borderColor: userRoleInfo.accentColor }}>
            <span className="role-icon">{userRoleInfo.icon}</span>
            {userRoleInfo.name}
          </span>
          <span className="lock-divider">➔</span>
          <span className="required-role-badge">
            <span className="role-icon">{reqRoleInfo.icon}</span>
            {reqRoleInfo.name} Required
          </span>
        </div>

        <h2 className="permission-title">Access Restricted: {featureName}</h2>
        <p className="permission-subtitle">
          Hello <strong>{userName}</strong>, your account is configured as <strong>{userRoleInfo.name}</strong>. 
          Access to <strong>{featureName}</strong> is reserved exclusively for <strong>{reqRoleInfo.name}</strong>.
        </p>
      </div>

      {/* Role Capabilities Box */}
      <div className="role-capabilities-box">
        <div className="capabilities-header">
          <span className="check-icon">✨</span>
          <h4>What you can do as {userRoleInfo.name}:</h4>
        </div>
        <ul className="capabilities-list">
          {userRoleInfo.permissions.map((perm, idx) => (
            <li key={idx}>
              <span className="list-check">✓</span>
              <span>{perm}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="permission-actions">
        {onNavigateHome && (
          <button
            type="button"
            className="btn-permission-primary"
            onClick={onNavigateHome}
          >
            <span>🏠 Return to Dashboard</span>
          </button>
        )}

        {onSwitchAccount && (
          <button
            type="button"
            className="btn-permission-secondary"
            onClick={onSwitchAccount}
          >
            <span>🔄 Switch / Login as {reqRoleInfo.name}</span>
          </button>
        )}

        {!isInline && onClose && (
          <button
            type="button"
            className="btn-permission-ghost"
            onClick={onClose}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return <div className="role-permission-inline-wrapper">{content}</div>;
  }

  return (
    <div className="role-permission-overlay" onClick={onClose}>
      <div className="role-permission-modal-container" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};

export default RolePermissionModal;
