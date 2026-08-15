import React, { useEffect, useState } from "react";
import RolePermissionModal from "../components/RolePermissionModal";
import { API_BASE } from "../config/api";

const API_URL = API_BASE;

interface ReportData {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockProducts: number;

  totalSales: number;
  confirmedSales: number;
  draftSales: number;
  cancelledSales: number;

  totalQuantity: number;
  totalRevenue: number;

  topProducts: {
    product_name: string;
    quantity: number;
    revenue: number;
  }[];

  topCustomers: {
    customer_name: string;
    orders: number;
    quantity: number;
    revenue: number;
  }[];

  recentSales: {
    id: number;
    challan_number: string;
    customer_name: string;
    status: string;
    total_quantity: number;
    total_amount: number;
    created_at: string;
  }[];
}

const emptyReport: ReportData = {
  totalCustomers: 0,
  activeCustomers: 0,
  totalProducts: 0,
  lowStockProducts: 0,

  totalSales: 0,
  confirmedSales: 0,
  draftSales: 0,
  cancelledSales: 0,

  totalQuantity: 0,
  totalRevenue: 0,

  topProducts: [],
  topCustomers: [],
  recentSales: [],
};

interface ReportsProps {
  role?: string;
  userName?: string;
  onNavigateHome?: () => void;
  onSwitchAccount?: () => void;
}

const Reports: React.FC<ReportsProps> = ({
  role = "ADMIN",
  userName = "Team Member",
  onNavigateHome,
  onSwitchAccount,
}) => {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setMessage("");
      setIsAccessDenied(false);

      const response = await fetch(`${API_URL}/reports`);

      const text = await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          "API returned non-JSON response. Check backend server.",
        );
      }

      if (response.status === 403 || result.message === "Access denied") {
        setIsAccessDenied(true);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch report");
      }

      const data = result.data || {};
      setReport({
        ...emptyReport,
        ...data,
        topProducts: data.topProducts || [],
        topCustomers: data.topCustomers || [],
        recentSales: data.recentSales || [],
      });
    } catch (error) {
      console.error("REPORT ERROR:", error);
      const errMsg = error instanceof Error ? error.message : "Failed to fetch reports";
      if (errMsg.toLowerCase().includes("access denied")) {
        setIsAccessDenied(true);
      } else {
        setMessage(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatMoney = (value: number) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <main className="container report-page">
        <section className="card">
          <p className="loading">Loading reports & analytics...</p>
        </section>
      </main>
    );
  }

  // If role is not ADMIN or 403 Access Denied, render the attractive Role-Aware Permission UI
  if (isAccessDenied || (role && role !== "ADMIN")) {
    return (
      <main className="container report-page">
        <RolePermissionModal
          currentRole={role}
          userName={userName}
          requiredRole="ADMIN"
          featureName="Reports & Financial Analytics"
          isInline={true}
          onNavigateHome={onNavigateHome}
          onSwitchAccount={onSwitchAccount}
        />
      </main>
    );
  }

  return (
    <main className="container report-page">
      {message && (
        <div
          className="message"
          style={{
            marginBottom: "20px",
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          }}
        >
          {message}
        </div>
      )}

      <section className="card report-hero">
        <div className="card-header">
          <div>
            <p className="eyebrow">BUSINESS INTELLIGENCE</p>
            <h2>Reports & Analytics</h2>
            <p>
              Business summary of customers, products, sales and inventory.
            </p>
          </div>

          <button className="btn refresh" onClick={fetchReport}>
            Refresh
          </button>
        </div>
      </section>

      <section className="report-stat-grid">
        <div className="stat-card primary">
          <span>Total Customers</span>
          <strong>{report.totalCustomers}</strong>
        </div>

        <div className="stat-card success">
          <span>Active Customers</span>
          <strong>{report.activeCustomers}</strong>
        </div>

        <div className="stat-card">
          <span>Total Products</span>
          <strong>{report.totalProducts}</strong>
        </div>

        <div className="stat-card warning">
          <span>Low Stock</span>
          <strong>{report.lowStockProducts}</strong>
        </div>
      </section>

      <section className="card">
        <h2>Sales Summary</h2>

        <div className="report-stat-grid">
          <div className="stat-card">
            <span>Total Sales</span>
            <strong>{report.totalSales}</strong>
          </div>

          <div className="stat-card success">
            <span>Confirmed Sales</span>
            <strong>{report.confirmedSales}</strong>
          </div>

          <div className="stat-card warning">
            <span>Draft Sales</span>
            <strong>{report.draftSales}</strong>
          </div>

          <div className="stat-card danger">
            <span>Cancelled Sales</span>
            <strong>{report.cancelledSales}</strong>
          </div>
        </div>

        <div className="report-stat-grid sub">
          <div className="stat-card">
            <span>Total Items Sold</span>
            <strong>{report.totalQuantity}</strong>
          </div>

          <div className="stat-card primary">
            <span>Total Revenue</span>
            <strong>{formatMoney(report.totalRevenue)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Top Products</h2>

        {report.topProducts.length === 0 ? (
          <p className="empty">No product sales yet</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>

              <tbody>
                {report.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.product_name}</td>
                    <td>{product.quantity}</td>
                    <td>{formatMoney(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Top Customers</h2>

        {report.topCustomers.length === 0 ? (
          <p className="empty">No customer purchases yet</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Quantity</th>
                  <th>Total Spent</th>
                </tr>
              </thead>

              <tbody>
                {report.topCustomers.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.customer_name}</td>
                    <td>{customer.orders}</td>
                    <td>{customer.quantity}</td>
                    <td>{formatMoney(customer.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Recent Sales Activity</h2>

        {report.recentSales.length === 0 ? (
          <p className="empty">No recent sales</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {report.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.challan_number}</td>
                    <td>{sale.customer_name}</td>
                    <td>
                      <span className={`badge ${sale.status.toLowerCase()}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td>{sale.total_quantity}</td>
                    <td>{formatMoney(sale.total_amount)}</td>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default Reports;
