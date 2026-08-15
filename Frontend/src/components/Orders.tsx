import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";

const API = API_BASE;

type Customer = {
  id: number;
  name: string;
  mobile: string;
  business_name?: string | null;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  unit_price: number | string;
  current_stock: number;
};

type OrderItem = {
  id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
};

type Order = {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: Customer;
  total_quantity: number;
  total_amount: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  can_confirm?: boolean;
  unavailable_products?: string[];
  created_at?: string | null;
  items: OrderItem[];
};

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

const responseData = <T,>(payload: T[] | { data?: T[] }) =>
  Array.isArray(payload) ? payload : (payload.data ?? []);

export default function Orders({ role: _role }: { role?: string } = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [customerRes, productRes, ordersRes] = await Promise.all([
        fetch(`${API}/customers`),
        fetch(`${API}/products`),
        fetch(`${API}/orders`),
      ]);
      const responses = [customerRes, productRes, ordersRes];
      if (responses.some((response) => !response.ok)) {
        throw new Error(
          "Unable to load order data. Please check that the backend is running.",
        );
      }
      const [customerData, productData, ordersData] = await Promise.all(
        responses.map((response) => response.json()),
      );
      setCustomers(responseData<Customer>(customerData));
      setProducts(responseData<Product>(productData));
      setOrders(responseData<Order>(ordersData));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load order data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId),
  );
  const cartQuantityForProduct = selectedProduct
    ? (cart.find((item) => item.product_id === selectedProduct.id)?.quantity ??
      0)
    : 0;
  const totalQuantity = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );
  const grandTotal = useMemo(
    () =>
      cart.reduce((total, item) => total + item.unit_price * item.quantity, 0),
    [cart],
  );

  const addToCart = () => {
    if (!selectedProduct) return setError("Please select a product.");
    if (!Number.isInteger(quantity) || quantity < 1)
      return setError("Quantity must be a whole number greater than zero.");
    if (cartQuantityForProduct + quantity > selectedProduct.current_stock) {
      return setError(
        `Only ${selectedProduct.current_stock} unit(s) of ${selectedProduct.name} are in stock.`,
      );
    }
    setCart((items) => {
      const existing = items.find(
        (item) => item.product_id === selectedProduct.id,
      );
      if (existing) {
        return items.map((item) =>
          item.product_id === selectedProduct.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...items,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          sku: selectedProduct.sku,
          unit_price: Number(selectedProduct.unit_price),
          quantity,
        },
      ];
    });
    setProductId("");
    setQuantity(1);
    setError("");
  };

  const createOrder = async () => {
    if (!customerId) return setError("Please select a customer.");
    if (!cart.length) return setError("Add at least one product to the order.");
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: Number(customerId),
          items: cart.map(({ product_id, quantity: itemQuantity }) => ({
            product_id,
            quantity: itemQuantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message ?? "Failed to create order");
      setMessage(`Order ${data.order?.order_number ?? ""} created as a draft.`);
      setCart([]);
      setCustomerId("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const updateOrderStatus = async (
    order: Order,
    action: "confirm" | "cancel",
  ) => {
    const actionLabel = action === "confirm" ? "confirm" : "cancel";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} ${order.order_number}?`,
      )
    )
      return;
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API}/orders/${order.id}/${action}`, {
        method: "PUT",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message ?? `Failed to ${actionLabel} order`);
      setMessage(
        `Order ${order.order_number} ${action === "confirm" ? "confirmed" : "cancelled"}.`,
      );
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${actionLabel} order`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOrder = async (order: Order) => {
    const stockNote =
      order.status === "CONFIRMED" ? " Stock will be restored." : "";
    if (
      !window.confirm(
        `Permanently delete ${order.order_number}? This cannot be undone.${stockNote}`,
      )
    )
      return;
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${API}/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message ?? "Failed to delete order history");
      setMessage(`Order ${order.order_number} deleted.`);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete order history",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      {message && (
        <div className="message" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="message order-error" role="alert">
          {error}
        </div>
      )}
      <section className="card">
        <div className="card-header">
          <h2>Create New Order</h2>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="order-customer">Customer *</label>
            <select
              id="order-customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.mobile}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="order-product">Product *</label>
            <select
              id="order-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Select Product</option>
              {products
                .filter((product) => product.current_stock > 0)
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} | {currency(Number(product.unit_price))} |
                    Stock: {product.current_stock}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="order-quantity">Quantity *</label>
            <input
              id="order-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>
          <div className="form-group order-add-button">
            <button className="btn primary" type="button" onClick={addToCart}>
              + Add Product
            </button>
          </div>
        </div>
        {cart.length > 0 && (
          <div className="order-items">
            <h3>Order Items</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.product_name}</td>
                      <td>{item.sku}</td>
                      <td>{currency(item.unit_price)}</td>
                      <td>{item.quantity}</td>
                      <td>{currency(item.unit_price * item.quantity)}</td>
                      <td>
                        <button
                          className="btn delete"
                          type="button"
                          onClick={() =>
                            setCart((items) =>
                              items.filter(
                                (cartItem) =>
                                  cartItem.product_id !== item.product_id,
                              ),
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-total">
              <strong>Total Items: {totalQuantity}</strong>
              <strong>Grand Total: {currency(grandTotal)}</strong>
            </div>
            <div className="form-buttons">
              <button
                className="btn primary"
                type="button"
                onClick={createOrder}
                disabled={submitting}
              >
                {submitting ? "Creating Order..." : "Create Order"}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={() => setCart([])}
                disabled={submitting}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="card">
        <div className="card-header">
          <h2>Orders List</h2>
          <button
            className="btn refresh"
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty">No orders found</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order No.</th>
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
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                    </td>
                    <td>
                      {order.customer?.name ?? `Customer #${order.customer_id}`}
                    </td>
                    <td>{order.items?.length ?? 0}</td>
                    <td>{order.total_quantity}</td>
                    <td>{currency(Number(order.total_amount))}</td>
                    <td>
                      <span
                        className={`status order-status-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn refresh"
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                        {order.status === "DRAFT" && (
                          <>
                            <button
                              className="btn primary"
                              type="button"
                              disabled={
                                submitting || order.can_confirm === false
                              }
                              title={
                                order.can_confirm === false
                                  ? `Cannot confirm: ${order.unavailable_products?.join(", ")} is no longer available.`
                                  : undefined
                              }
                              onClick={() =>
                                void updateOrderStatus(order, "confirm")
                              }
                            >
                              {order.can_confirm === false
                                ? "Product unavailable"
                                : "Confirm"}
                            </button>
                            <button
                              className="btn delete"
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                void updateOrderStatus(order, "cancel")
                              }
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          className="btn delete"
                          type="button"
                          disabled={submitting}
                          onClick={() => void deleteOrder(order)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedOrder && (
        <div
          className="order-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h2 id="order-details-title">{selectedOrder.order_number}</h2>
                <p>
                  {selectedOrder.customer?.name ??
                    `Customer #${selectedOrder.customer_id}`}{" "}
                  · {selectedOrder.customer?.mobile}
                </p>
              </div>
              <button
                className="btn secondary"
                type="button"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
            <div className="table-container">
              <table>
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
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id ?? item.product_id}>
                      <td>{item.product_name}</td>
                      <td>{item.sku}</td>
                      <td>{currency(Number(item.unit_price))}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {currency(Number(item.unit_price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-total">
              <strong>Status: {selectedOrder.status}</strong>
              <strong>
                Grand Total: {currency(Number(selectedOrder.total_amount))}
              </strong>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}