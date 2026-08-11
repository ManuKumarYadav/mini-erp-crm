import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  business_name?: string | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: number | string;
  current_stock: number;
}

interface SaleItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

interface Sale {
  id: number;
  challan_number: string;
  customer_id: number;
  total_quantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_at?: string;
  customers?: Customer;
  challan_items?: SaleItem[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}

const Sales: React.FC = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [items, setItems] = useState<SaleItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // FETCH HELPER
  // =====================================================

  const fetchJson = async (
    url: string,
    options?: RequestInit,
  ): Promise<any> => {
    const response = await fetch(url, options);

    const text = await response.text();

    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `API returned non-JSON response.\nURL: ${url}\nStatus: ${response.status}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  };

  // =====================================================
  // LOAD CUSTOMERS, PRODUCTS AND SALES
  // =====================================================

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError("");

      const [customersResponse, productsResponse, salesResponse] =
        await Promise.all([
          fetchJson(`${API_URL}/customers`),
          fetchJson(`${API_URL}/products`),
          fetchJson(`${API_URL}/sales`),
        ]);

      setCustomers(customersResponse.data || []);
      setProducts(productsResponse.data || []);
      setSales(salesResponse.data || []);
    } catch (err) {
      console.error("LOAD SALES DATA ERROR:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load sales data",
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // ADD PRODUCT TO SALE
  // =====================================================

  const handleAddProduct = () => {
    setError("");
    setMessage("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const product = products.find((p) => p.id === Number(selectedProduct));

    if (!product) {
      setError("Product not found.");
      return;
    }

    if (quantity > product.current_stock) {
      setError(
        `Insufficient stock for ${product.name}. Available stock: ${product.current_stock}`,
      );
      return;
    }

    // Check if product already exists in current sale
    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.current_stock) {
        setError(
          `Cannot add more ${product.name}. Available stock: ${product.current_stock}`,
        );
        return;
      }

      setItems(
        items.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item,
        ),
      );
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        unit_price: Number(product.unit_price),
        quantity,
      };

      setItems([...items, newItem]);
    }

    setSelectedProduct("");
    setQuantity(1);
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const handleRemoveProduct = (productId: number) => {
    setItems(items.filter((item) => item.product_id !== productId));
  };

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const handleClear = () => {
    setSelectedCustomer("");
    setSelectedProduct("");
    setQuantity(1);
    setItems([]);
    setMessage("");
    setError("");
  };

  // =====================================================
  // TOTAL QUANTITY
  // =====================================================

  const totalQuantity = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.unit_price * item.quantity,
      0,
    );
  }, [items]);

  // =====================================================
  // CREATE SALE
  // =====================================================

  const handleCreateSale = async () => {
    setError("");
    setMessage("");

    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer_id: Number(selectedCustomer),

        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      console.log("CREATE SALE PAYLOAD:", payload);

      const response: ApiResponse<Sale> = await fetchJson(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to create sale");
      }

      const challanNumber = response.data?.challan_number || "";

      setMessage(
        `Sale created successfully${
          challanNumber ? ` - ${challanNumber}` : ""
        }`,
      );

      // Clear form
      setSelectedCustomer("");
      setSelectedProduct("");
      setQuantity(1);
      setItems([]);

      // Reload products because stock was reduced
      // and reload sales history
      await loadData();
    } catch (err) {
      console.error("CREATE SALE ERROR:", err);

      setError(err instanceof Error ? err.message : "Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CANCEL SALE
  // =====================================================

  const handleCancelSale = async (saleId: number) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this sale?",
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await fetchJson(`${API_URL}/sales/${saleId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setMessage("Sale cancelled successfully and stock restored.");

      await loadData();
    } catch (err) {
      console.error("CANCEL SALE ERROR:", err);

      setError(err instanceof Error ? err.message : "Failed to cancel sale");
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN");
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="page-container">
      {/* =================================================
          ALERTS
      ================================================= */}

      {message && <div className="alert success-alert">{message}</div>}

      {error && <div className="alert error-alert">{error}</div>}

      {/* =================================================
          CREATE SALE
      ================================================= */}

      <section className="card">
        <h2>Create New Sale</h2>

        {/* CUSTOMER */}

        <div className="form-group">
          <label>
            Customer <span>*</span>
          </label>

          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            disabled={loadingData || loading}
          >
            <option value="">Select Customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.mobile}
              </option>
            ))}
          </select>
        </div>

        {/* PRODUCT + QUANTITY */}

        <div className="form-row">
          <div className="form-group">
            <label>
              Product <span>*</span>
            </label>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={loadingData || loading}
            >
              <option value="">Select Product</option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={product.current_stock <= 0}
                >
                  {product.name} - {product.sku} - ₹
                  {Number(product.unit_price).toFixed(2)}
                  {" | Stock: "}
                  {product.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Quantity <span>*</span>
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAddProduct}
          disabled={loading || loadingData}
        >
          + Add Product
        </button>
      </section>

      {/* =================================================
          SALE ITEMS
      ================================================= */}

      <section className="card">
        <h2>Sale Items</h2>

        {items.length === 0 ? (
          <div className="empty-state">No products added</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.product_name}</td>

                      <td>{item.sku}</td>

                      <td>{formatCurrency(item.unit_price)}</td>

                      <td>{item.quantity}</td>

                      <td>{formatCurrency(item.unit_price * item.quantity)}</td>

                      <td>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleRemoveProduct(item.product_id)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}

            <div className="totals">
              <strong>Total Quantity: {totalQuantity}</strong>

              <strong>Total Amount: {formatCurrency(totalAmount)}</strong>
            </div>

            {/* ACTION BUTTONS */}

            <div className="action-buttons">
              <button
                type="button"
                className="primary-button"
                onClick={handleCreateSale}
                disabled={loading}
              >
                {loading ? "Creating Sale..." : "Create Sale"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </>
        )}
      </section>

      {/* =================================================
          SALES HISTORY
      ================================================= */}

      <section className="card">
        <div className="section-header">
          <h2>Sales History</h2>

          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
            disabled={loadingData}
          >
            {loadingData ? "Loading..." : "Refresh"}
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="empty-state">No sales found</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => {
                  const saleAmount =
                    sale.challan_items?.reduce(
                      (total, item) =>
                        total + Number(item.unit_price) * item.quantity,
                      0,
                    ) || 0;

                  return (
                    <tr key={sale.id}>
                      <td>
                        <strong>{sale.challan_number}</strong>
                      </td>

                      <td>{sale.customers?.name || "Unknown Customer"}</td>

                      <td>{sale.total_quantity}</td>

                      <td>{formatCurrency(saleAmount)}</td>

                      <td>
                        <span className={`status ${sale.status.toLowerCase()}`}>
                          {sale.status}
                        </span>
                      </td>

                      <td>{formatDate(sale.created_at)}</td>

                      <td>
                        {sale.status === "CONFIRMED" ? (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => handleCancelSale(sale.id)}
                          >
                            Cancel
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          CSS
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .page-container {
          padding: 34px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
        }

        .card h2 {
          margin-top: 0;
          margin-bottom: 26px;
          color: #1f2937;
          font-size: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 22px;
          flex: 1;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 9px;
          color: #111827;
        }

        .form-group label span {
          color: #ef4444;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          font-size: 16px;
          outline: none;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .primary-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 13px 22px;
          border-radius: 7px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-button:hover {
          background: #1d4ed8;
        }

        .primary-button:disabled {
          background: #93a4c7;
          cursor: not-allowed;
        }

        .secondary-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 13px 22px;
          border-radius: 7px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .secondary-button:hover {
          background: #4b5563;
        }

        .secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .danger-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 9px 15px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .danger-button:hover {
          background: #dc2626;
        }

        .table-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f3f4f6;
          padding: 14px;
          text-align: left;
          color: #374151;
          font-weight: 700;
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 15px 14px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        tr:hover td {
          background: #fafafa;
        }

        .totals {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          font-size: 18px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          margin-bottom: 0;
        }

        .empty-state {
          text-align: center;
          padding: 45px;
          color: #6b7280;
          font-size: 17px;
        }

        .alert {
          padding: 15px 18px;
          border-radius: 8px;
          margin-bottom: 22px;
          font-weight: 500;
          white-space: pre-line;
        }

        .success-alert {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .error-alert {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .status {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .status.confirmed {
          background: #dcfce7;
          color: #166534;
        }

        .status.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .status.draft {
          background: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {

          .page-container {
            padding: 15px;
          }

          .card {
            padding: 18px;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .totals {
            flex-direction: column;
            gap: 10px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
};

export default Sales;