import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  business_name?: string;
}

interface ChallanItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string | number;
  quantity: number;
}

interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  total_quantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_at: string;
  customers?: Customer;
  challan_items?: ChallanItem[];
}

const Orders: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // FETCH CHALLANS
  const fetchChallans = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/challans`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `API Error ${response.status}: ${text.substring(0, 100)}`,
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setChallans(data);
      } else if (Array.isArray(data.data)) {
        setChallans(data.data);
      } else if (Array.isArray(data.challans)) {
        setChallans(data.challans);
      } else {
        setChallans([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  // FILTER
  const filteredChallans = challans.filter((challan) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      challan.challan_number?.toLowerCase().includes(searchText) ||
      challan.customers?.name?.toLowerCase().includes(searchText) ||
      challan.customers?.business_name?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" || challan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // STATUS BADGE
  const getStatusClass = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "status confirmed";

      case "DRAFT":
        return "status draft";

      case "CANCELLED":
        return "status cancelled";

      default:
        return "status";
    }
  };

  // TOTAL AMOUNT
  const getTotalAmount = (challan: Challan) => {
    if (!challan.challan_items) return 0;

    return challan.challan_items.reduce((total, item) => {
      return total + Number(item.unit_price) * Number(item.quantity);
    }, 0);
  };

  return (
    <div className="orders-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>Manage sales orders and challans</p>
        </div>

        <button className="refresh-btn" onClick={fetchChallans}>
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Orders</span>
          <strong>{challans.length}</strong>
        </div>

        <div className="summary-card">
          <span>Draft</span>
          <strong>{challans.filter((c) => c.status === "DRAFT").length}</strong>
        </div>

        <div className="summary-card">
          <span>Confirmed</span>
          <strong>
            {challans.filter((c) => c.status === "CONFIRMED").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Cancelled</span>
          <strong>
            {challans.filter((c) => c.status === "CANCELLED").length}
          </strong>
        </div>
      </div>

      {/* FILTER */}
      <div className="filter-card">
        <input
          type="text"
          placeholder="Search challan number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* ORDERS TABLE */}
      <div className="orders-card">
        <div className="card-title">
          <h2>Order / Challan List</h2>
        </div>

        {loading ? (
          <div className="empty-message">Loading orders...</div>
        ) : filteredChallans.length === 0 ? (
          <div className="empty-message">No orders found</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredChallans.map((challan) => (
                  <tr key={challan.id}>
                    <td>
                      <strong>{challan.challan_number}</strong>
                    </td>

                    <td>
                      <div>
                        {challan.customers?.name ||
                          `Customer #${challan.customer_id}`}
                      </div>

                      {challan.customers?.business_name && (
                        <small>{challan.customers.business_name}</small>
                      )}
                    </td>

                    <td>{challan.challan_items?.length || 0}</td>

                    <td>{challan.total_quantity}</td>

                    <td>₹{getTotalAmount(challan).toFixed(2)}</td>

                    <td>
                      <span className={getStatusClass(challan.status)}>
                        {challan.status}
                      </span>
                    </td>

                    <td>
                      {challan.created_at
                        ? new Date(challan.created_at).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>

                    <td>
                      <button
                        className="view-btn"
                        onClick={() => setSelectedChallan(challan)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {selectedChallan && (
        <div className="modal-overlay" onClick={() => setSelectedChallan(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedChallan.challan_number}</h2>

                <p>Order / Sales Challan Details</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setSelectedChallan(null)}
              >
                ×
              </button>
            </div>

            {/* CUSTOMER */}
            <div className="detail-section">
              <h3>Customer</h3>

              <p>
                <strong>Name:</strong> {selectedChallan.customers?.name || "-"}
              </p>

              <p>
                <strong>Mobile:</strong>{" "}
                {selectedChallan.customers?.mobile || "-"}
              </p>

              <p>
                <strong>Business:</strong>{" "}
                {selectedChallan.customers?.business_name || "-"}
              </p>
            </div>

            {/* STATUS */}
            <div className="detail-section">
              <h3>Order Information</h3>

              <p>
                <strong>Status:</strong>{" "}
                <span className={getStatusClass(selectedChallan.status)}>
                  {selectedChallan.status}
                </span>
              </p>

              <p>
                <strong>Total Quantity:</strong>{" "}
                {selectedChallan.total_quantity}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {selectedChallan.created_at
                  ? new Date(selectedChallan.created_at).toLocaleString("en-IN")
                  : "-"}
              </p>
            </div>

            {/* PRODUCTS */}
            <div className="detail-section">
              <h3>Products</h3>

              {selectedChallan.challan_items?.length ? (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedChallan.challan_items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>

                        <td>{item.sku}</td>

                        <td>₹{Number(item.unit_price).toFixed(2)}</td>

                        <td>{item.quantity}</td>

                        <td>
                          ₹
                          {(
                            Number(item.unit_price) * Number(item.quantity)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No products found.</p>
              )}
            </div>

            {/* TOTAL */}
            <div className="modal-total">
              Total Amount: ₹{getTotalAmount(selectedChallan).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* PAGE CSS */}
      <style>{`

        .orders-page {
          padding: 30px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .page-header h2 {
          margin: 0;
          color: #172033;
        }

        .page-header p {
          margin-top: 5px;
          color: #667085;
        }

        .refresh-btn {
          border: none;
          background: #344054;
          color: white;
          padding: 11px 20px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .summary-card {
          background: white;
          padding: 22px;
          border-radius: 10px;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.06);
        }

        .summary-card span {
          color: #667085;
          display: block;
          margin-bottom: 8px;
        }

        .summary-card strong {
          font-size: 28px;
          color: #101828;
        }

        .filter-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }

        .filter-card input,
        .filter-card select {
          padding: 12px;
          border: 1px solid #d0d5dd;
          border-radius: 7px;
          font-size: 15px;
        }

        .filter-card input {
          flex: 1;
        }

        .orders-card {
          background: white;
          border-radius: 10px;
          padding: 25px;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.06);
        }

        .card-title h2 {
          margin-top: 0;
          margin-bottom: 20px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f2f4f7;
          padding: 14px;
          text-align: left;
          color: #344054;
        }

        td {
          padding: 14px;
          border-bottom:
            1px solid #eaecf0;
          color: #344054;
        }

        td small {
          color: #667085;
        }

        .status {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .confirmed {
          background: #dcfae6;
          color: #067647;
        }

        .draft {
          background: #fef0c7;
          color: #b54708;
        }

        .cancelled {
          background: #fee4e2;
          color: #b42318;
        }

        .view-btn {
          border: none;
          background: #2563eb;
          color: white;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .empty-message {
          text-align: center;
          padding: 50px;
          color: #667085;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          width: 900px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 12px;
          padding: 25px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          border-bottom:
            1px solid #eaecf0;
          padding-bottom: 15px;
        }

        .modal-header h2 {
          margin: 0;
        }

        .modal-header p {
          color: #667085;
        }

        .close-btn {
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 50%;
          background: #f2f4f7;
          font-size: 25px;
          cursor: pointer;
        }

        .detail-section {
          margin-top: 25px;
          padding-bottom: 20px;
          border-bottom:
            1px solid #eaecf0;
        }

        .detail-section h3 {
          margin-top: 0;
        }

        .items-table {
          margin-top: 10px;
        }

        .modal-total {
          text-align: right;
          font-size: 20px;
          font-weight: 700;
          margin-top: 20px;
        }

        @media (max-width: 800px) {

          .summary-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .filter-card {
            flex-direction: column;
          }

          .orders-page {
            padding: 15px;
          }

        }

      `}</style>
    </div>
  );
};

export default Orders;
