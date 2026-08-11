import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

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

const Reports: React.FC = () => {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      setMessage("");

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

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch report");
      }

      setReport(result.data || emptyReport);
    } catch (error) {
      console.error("REPORT ERROR:", error);

      setMessage(
        error instanceof Error ? error.message : "Failed to fetch reports",
      );
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
      <main className="container">
        <section className="card">
          <p className="loading">Loading reports...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">

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

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Reports & Analytics</h2>
            <p style={{ marginTop: "6px", color: "#64748b" }}>
              Business summary of customers, products, sales and inventory.
            </p>
          </div>

          <button className="btn refresh" onClick={fetchReport}>
            Refresh
          </button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card">
          <span>Total Customers</span>
          <strong>{report.totalCustomers}</strong>
        </div>

        <div className="stat-card">
          <span>Active Customers</span>
          <strong>{report.activeCustomers}</strong>
        </div>

        <div className="stat-card">
          <span>Total Products</span>
          <strong>{report.totalProducts}</strong>
        </div>

        <div className="stat-card">
          <span>Low Stock</span>
          <strong>{report.lowStockProducts}</strong>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Sales Summary</h2>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span>Total Sales</span>
            <strong>{report.totalSales}</strong>
          </div>

          <div className="stat-card">
            <span>Confirmed Sales</span>
            <strong>{report.confirmedSales}</strong>
          </div>

          <div className="stat-card">
            <span>Draft Sales</span>
            <strong>{report.draftSales}</strong>
          </div>

          <div className="stat-card">
            <span>Cancelled Sales</span>
            <strong>{report.cancelledSales}</strong>
          </div>

          <div className="stat-card">
            <span>Total Quantity</span>
            <strong>{report.totalQuantity}</strong>
          </div>

          <div className="stat-card">
            <span>Total Revenue</span>
            <strong>{formatMoney(report.totalRevenue)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Top Selling Products</h2>
        </div>

        {report.topProducts.length === 0 ? (
          <p className="empty">No product sales found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>

              <tbody>
                {report.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{product.product_name}</strong>
                    </td>

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
        <div className="card-header">
          <h2>Top Customers</h2>
        </div>

        {report.topCustomers.length === 0 ? (
          <p className="empty">No customer sales found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Quantity</th>
                  <th>Revenue</th>
                </tr>
              </thead>

              <tbody>
                {report.topCustomers.map((customer, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{customer.customer_name}</strong>
                    </td>

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
        <div className="card-header">
          <h2>Recent Sales</h2>
        </div>

        {report.recentSales.length === 0 ? (
          <p className="empty">No sales found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {report.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.challan_number}</strong>
                    </td>

                    <td>{sale.customer_name}</td>

                    <td>{sale.total_quantity}</td>

                    <td>{formatMoney(sale.total_amount)}</td>

                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background:
                            sale.status === "CONFIRMED"
                              ? "#dcfce7"
                              : sale.status === "CANCELLED"
                                ? "#fee2e2"
                                : "#fef3c7",
                          color:
                            sale.status === "CONFIRMED"
                              ? "#166534"
                              : sale.status === "CANCELLED"
                                ? "#991b1b"
                                : "#92400e",
                        }}
                      >
                        {sale.status}
                      </span>
                    </td>

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