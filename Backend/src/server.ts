import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma, { getResolvedDbConfig } from "./lib/prisma";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "mini_erp_crm_secret_key_2026";

/*
=====================================================
MIDDLEWARE
=====================================================
*/

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  // Normalize double /api/api prefixes or redundant slashes
  if (req.url.startsWith("/api/api/")) {
    req.url = req.url.replace(/^\/api\/api\//, "/api/");
  } else if (req.url === "/api/api") {
    req.url = "/api";
  }
  next();
});





/*
=====================================================
JWT TYPES
=====================================================
*/

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}


/*
=====================================================
AUTH REQUEST TYPE
=====================================================
*/

interface AuthRequest extends Request {
  user?: JwtPayload;
}


/*
=====================================================
AUTHENTICATION MIDDLEWARE
=====================================================
*/

const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });
    }

    const token =
      authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};


/*
=====================================================
ROLE MIDDLEWARE
=====================================================
*/

const allowRoles = (
  ...roles: string[]
) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};


/*
=====================================================
HEALTH CHECK
=====================================================
*/

app.get(
  "/",
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      message:
        "Mini ERP CRM Backend is running",
    });
  }
);


/*
=====================================================
DATABASE TEST
=====================================================
*/

app.get(
  "/api/health",
  async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        success: true,
        message: "Database connected",
      });
    } catch (error) {
      console.error(
        "DATABASE HEALTH ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Database connection failed",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
=====================================================
LOGIN
POST /api/auth/login
=====================================================
*/

app.post(
  ["/api/auth/login", "/auth/login"],
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      /*
       * Find user
       */
      const user =
        await prisma.users.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      /*
       * Compare password
       */
      const passwordMatch =
        await bcrypt.compare(
          String(password),
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      /*
       * Create JWT
       */
      const token =
        jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Login successful",

        token,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Login failed",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
=====================================================
CURRENT USER
GET /api/auth/me
=====================================================
*/

app.get(
  ["/api/auth/me", "/auth/me"],
  authenticateToken,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const user =
        await prisma.users.findUnique({
          where: {
            id: req.user!.id,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "GET CURRENT USER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to get current user",
      });
    }
  }
);


/*
=====================================================
CUSTOMERS
=====================================================
*/


/*
GET ALL CUSTOMERS
GET /api/customers
*/

app.get(
  "/api/customers",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const customers =
        await prisma.customers.findMany({
          orderBy: {
            id: "desc",
          },
        });

      res.json({
        success: true,
        count: customers.length,
        data: customers,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMERS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch customers",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
GET CUSTOMER
GET /api/customers/:id
*/

app.get(
  "/api/customers/:id",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      const customer =
        await prisma.customers.findUnique({
          where: {
            id,
          },
        });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
CREATE CUSTOMER
POST /api/customers
*/

app.post(
  "/api/customers",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
      } = req.body;

      if (!name || !mobile) {
        return res.status(400).json({
          success: false,
          message:
            "Name and mobile are required",
        });
      }

      const customer =
        await prisma.customers.create({
          data: {
            name,
            mobile,
            email: email || null,
            business_name:
              business_name || null,
            gst_number:
              gst_number || null,
            customer_type,
            address:
              address || null,
            status:
              status || "LEAD",
            follow_up_date:
              follow_up_date
                ? new Date(
                    follow_up_date
                  )
                : null,
            notes:
              notes || null,
          },
        });

      res.status(201).json({
        success: true,
        message:
          "Customer created successfully",
        data: customer,
      });
    } catch (error) {
      console.error(
        "CREATE CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create customer",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
UPDATE CUSTOMER
PUT /api/customers/:id
*/

app.put(
  "/api/customers/:id",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      const {
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
      } = req.body;

      const customer =
        await prisma.customers.update({
          where: {
            id,
          },

          data: {
            name,
            mobile,
            email:
              email || null,
            business_name:
              business_name || null,
            gst_number:
              gst_number || null,
            customer_type,
            address:
              address || null,
            status,
            follow_up_date:
              follow_up_date
                ? new Date(
                    follow_up_date
                  )
                : null,
            notes:
              notes || null,
          },
        });

      res.json({
        success: true,
        message:
          "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      console.error(
        "UPDATE CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update customer",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
DELETE CUSTOMER
DELETE /api/customers/:id
*/

app.delete(
  "/api/customers/:id",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      await prisma.customers.delete({
        where: {
          id,
        },
      });

      res.json({
        success: true,
        message:
          "Customer deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE CUSTOMER ERROR:",
        error
      );

      res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }
  }
);


/*
=====================================================
PRODUCTS
=====================================================
*/


/*
GET PRODUCTS
*/

app.get(
  "/api/products",
  authenticateToken,
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await prisma.products.findMany({
          orderBy: {
            id: "desc",
          },
        });

      const result =
        products.map(
          (product) => ({
            ...product,
            unit_price:
              Number(
                product.unit_price
              ),
          })
        );

      res.json({
        success: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.error(
        "GET PRODUCTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch products",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
GET PRODUCT
*/

app.get(
  "/api/products/:id",
  authenticateToken,
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const product =
        await prisma.products.findUnique({
          where: {
            id,
          },
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      res.json({
        success: true,
        data: {
          ...product,
          unit_price:
            Number(
              product.unit_price
            ),
        },
      });
    } catch (error) {
      console.error(
        "GET PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch product",
      });
    }
  }
);


/*
CREATE PRODUCT
*/

app.post(
  "/api/products",
  authenticateToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        sku,
        category,
        unit_price,
        current_stock,
        minimum_stock,
        warehouse_location,
      } = req.body;

      if (
        !name ||
        !sku ||
        unit_price ===
          undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, SKU and unit price are required",
        });
      }

      const product =
        await prisma.products.create({
          data: {
            name,
            sku,
            category:
              category || null,

            unit_price:
              Number(unit_price),

            current_stock:
              Number(
                current_stock || 0
              ),

            minimum_stock:
              Number(
                minimum_stock || 0
              ),

            warehouse_location:
              warehouse_location ||
              null,
          },
        });

      res.status(201).json({
        success: true,
        message:
          "Product created successfully",

        data: {
          ...product,
          unit_price:
            Number(
              product.unit_price
            ),
        },
      });
    } catch (error: any) {
      console.error(
        "CREATE PRODUCT ERROR:",
        error
      );

      if (
        error?.code ===
        "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "SKU already exists",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to create product",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
UPDATE PRODUCT
*/

app.put(
  "/api/products/:id",
  authenticateToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const {
        name,
        sku,
        category,
        unit_price,
        current_stock,
        minimum_stock,
        warehouse_location,
      } = req.body;

      const product =
        await prisma.products.update({
          where: {
            id,
          },

          data: {
            name,
            sku,
            category:
              category || null,

            unit_price:
              Number(unit_price),

            current_stock:
              Number(current_stock),

            minimum_stock:
              Number(minimum_stock),

            warehouse_location:
              warehouse_location ||
              null,
          },
        });

      res.json({
        success: true,
        message:
          "Product updated successfully",

        data: {
          ...product,
          unit_price:
            Number(
              product.unit_price
            ),
        },
      });
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update product",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
DELETE PRODUCT
*/

app.delete(
  "/api/products/:id",
  authenticateToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      /*
       * Check whether product
       * is used in order items.
       */
      const orderItemCount =
        await prisma.challan_items.count({
          where: {
            product_id: id,
          },
        });

      if (orderItemCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            `Cannot delete this product because it is used in ${orderItemCount} order item(s).`,
        });
      }

      await prisma.products.delete({
        where: {
          id,
        },
      });

      res.json({
        success: true,
        message:
          "Product deleted successfully",
      });
    } catch (error: any) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      if (
        error?.code ===
        "P2003"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This product is used in existing records.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to delete product",
      });
    }
  }
);


/*
=====================================================
ORDERS
=====================================================
*/

const orderResponse = (order: any) => ({
  id: order.id,
  order_number: order.order_number,
  customer_id: order.customer_id,
  customer: order.customers,
  total_quantity: order.total_quantity,
  total_amount: Number(order.total_amount),
  status: order.status === "PENDING" ? "DRAFT" : order.status,
  created_at: order.created_at,
  items: order.order_items.map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    unit_price: Number(item.unit_price),
    quantity: item.quantity,
  })),
});

const orderInclude = {
  customers: true,
  order_items: { include: { products: true } },
};

app.get("/api/orders", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
      include: orderInclude,
      orderBy: { id: "desc" },
    });

    const data = orders.map((order) => {
      const response = orderResponse(order);
      const unavailableProducts = order.order_items
        .filter((item) => item.products.current_stock < item.quantity)
        .map((item) => item.product_name);
      return {
        ...response,
        can_confirm: order.status === "PENDING" && unavailableProducts.length === 0,
        unavailable_products: unavailableProducts,
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

app.post("/api/orders", authenticateToken, allowRoles("ADMIN", "SALES"), async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.body.customer_id);
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!Number.isInteger(customerId) || customerId <= 0 || items.length === 0) {
      return res.status(400).json({ success: false, message: "A customer and at least one item are required" });
    }

    const requestedItems: { product_id: number; quantity: number }[] = items.map((item: any) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
    }));
    if (requestedItems.some((item: any) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return res.status(400).json({ success: false, message: "Order item quantities must be positive whole numbers" });
    }

    const customer = await prisma.customers.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const productIds: number[] = [...new Set(requestedItems.map((item) => item.product_id))];
    const products = await prisma.products.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: "One or more products were not found" });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const totalQuantity = requestedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalAmount = requestedItems.reduce((sum: number, item: any) => {
      const product = productById.get(item.product_id)!;
      return sum + Number(product.unit_price) * item.quantity;
    }, 0);

    const order = await prisma.orders.create({
      data: {
        order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customer_id: customerId,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
        status: "PENDING",
        order_items: {
          create: requestedItems.map((item: any) => {
            const product = productById.get(item.product_id)!;
            return {
              product_id: product.id,
              product_name: product.name,
              sku: product.sku,
              unit_price: product.unit_price,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: orderInclude,
    });

    return res.status(201).json({ success: true, order: orderResponse(order) });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

app.put("/api/orders/:id/confirm", authenticateToken, allowRoles("ADMIN", "WAREHOUSE"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.orders.findUnique({ where: { id }, include: orderInclude });
      if (!existing) throw new Error("ORDER_NOT_FOUND");
      if (existing.status !== "PENDING") throw new Error("ORDER_NOT_DRAFT");

      const unavailable = existing.order_items.find((item) => item.products.current_stock < item.quantity);
      if (unavailable) throw new Error(`INSUFFICIENT_STOCK:${unavailable.product_name}`);

      for (const item of existing.order_items) {
        await tx.products.update({ where: { id: item.product_id }, data: { current_stock: { decrement: item.quantity } } });
      }
      return tx.orders.update({ where: { id }, data: { status: "CONFIRMED" }, include: orderInclude });
    }, { timeout: 30000, maxWait: 15000 });
    return res.json({ success: true, order: orderResponse(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm order";
    if (message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Order not found" });
    if (message === "ORDER_NOT_DRAFT") return res.status(409).json({ success: false, message: "Only draft orders can be confirmed" });
    if (message.startsWith("INSUFFICIENT_STOCK:")) return res.status(409).json({ success: false, message: `Insufficient stock for ${message.split(":")[1]}` });
    console.error("CONFIRM ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to confirm order" });
  }
});

app.put("/api/orders/:id/cancel", authenticateToken, allowRoles("ADMIN", "WAREHOUSE"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.orders.findUnique({ where: { id }, include: orderInclude });
      if (!existing) throw new Error("ORDER_NOT_FOUND");
      if (existing.status === "CANCELLED") throw new Error("ORDER_CANCELLED");
      if (existing.status === "CONFIRMED") {
        for (const item of existing.order_items) {
          await tx.products.update({ where: { id: item.product_id }, data: { current_stock: { increment: item.quantity } } });
        }
      }
      return tx.orders.update({ where: { id }, data: { status: "CANCELLED" }, include: orderInclude });
    }, { timeout: 30000, maxWait: 15000 });
    return res.json({ success: true, order: orderResponse(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    if (message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Order not found" });
    if (message === "ORDER_CANCELLED") return res.status(409).json({ success: false, message: "Order is already cancelled" });
    console.error("CANCEL ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

app.delete("/api/orders/:id", authenticateToken, allowRoles("ADMIN", "SALES"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { id }, include: orderInclude });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status === "CONFIRMED") {
        for (const item of order.order_items) {
          await tx.products.update({ where: { id: item.product_id }, data: { current_stock: { increment: item.quantity } } });
        }
      }
      await tx.orders.delete({ where: { id } });
    }, { timeout: 30000, maxWait: 15000 });
    return res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Order not found" });
    console.error("DELETE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

/*
=====================================================
SALES
=====================================================
*/


/*
GET SALES
*/

app.get(
  "/api/sales",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const sales =
        await prisma.challans.findMany({
          include: {
            customers: true,
            challan_items: true,
          },

          orderBy: {
            id: "desc",
          },
        });

      const result =
        sales
          .filter(
            (sale) =>
              !sale.challan_number.startsWith(
                "ORD-"
              )
          )
          .map((sale) => ({
            id: sale.id,

            sale_number:
              sale.challan_number,

            challan_number:
              sale.challan_number,

            customer_id:
              sale.customer_id,

            customer:
              sale.customers,

            customers:
              sale.customers,

            total_quantity:
              sale.total_quantity,

            status:
              sale.status,

            created_at:
              sale.created_at,

            items:
              sale.challan_items.map(
                (item) => ({
                  id: item.id,

                  product_id:
                    item.product_id,

                  product_name:
                    item.product_name,

                  sku:
                    item.sku,

                  unit_price:
                    Number(
                      item.unit_price
                    ),

                  quantity:
                    item.quantity,

                  total:
                    Number(
                      item.unit_price
                    ) *
                    item.quantity,
                })
              ),

            total_amount:
              sale.challan_items.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.unit_price
                  ) *
                    item.quantity,

                0
              ),
          }));

      res.json({
        success: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.error(
        "GET SALES ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch sales",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
GET SINGLE SALE
*/

app.get(
  "/api/sales/:id",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sale ID",
        });
      }

      const sale =
        await prisma.challans.findUnique({
          where: {
            id,
          },

          include: {
            customers: true,

            challan_items: {
              include: {
                products: true,
              },
            },
          },
        });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message:
            "Sale not found",
        });
      }

      res.json({
        success: true,
        data: sale,
      });
    } catch (error) {
      console.error(
        "GET SALE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch sale",
      });
    }
  }
);


/*
=====================================================
CREATE SALE
POST /api/sales
=====================================================
*/

app.post(
  "/api/sales",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (req: AuthRequest, res: Response) => {
    try {
      const customerId = Number(req.body.customer_id);
      const items = Array.isArray(req.body.items) ? req.body.items : [];

      if (!Number.isInteger(customerId) || customerId <= 0 || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Customer and at least one product are required",
        });
      }

      const requestedItems: { product_id: number; quantity: number }[] = items.map((item: any) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));

      if (
        requestedItems.some(
          (item) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be a positive number",
        });
      }

      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      const productIds = [...new Set(requestedItems.map((item) => item.product_id))];
      const products = await prisma.products.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected products were not found",
        });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Check stock
      for (const item of requestedItems) {
        const prod = productMap.get(item.product_id)!;
        if (prod.current_stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${prod.name}. Available: ${prod.current_stock}`,
          });
        }
      }

      const totalQuantity = requestedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = requestedItems.reduce((sum, item) => {
        const prod = productMap.get(item.product_id)!;
        return sum + Number(prod.unit_price) * item.quantity;
      }, 0);

      const challanNumber = `CHL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const sale = await prisma.$transaction(async (tx) => {
        // Create challan
        const newChallan = await tx.challans.create({
          data: {
            challan_number: challanNumber,
            customer_id: customerId,
            total_quantity: totalQuantity,
            status: "CONFIRMED",
            created_by: req.user?.id || null,
            challan_items: {
              create: requestedItems.map((item) => {
                const prod = productMap.get(item.product_id)!;
                return {
                  product_id: prod.id,
                  product_name: prod.name,
                  sku: prod.sku,
                  unit_price: prod.unit_price,
                  quantity: item.quantity,
                };
              }),
            },
          },
          include: {
            customers: true,
            challan_items: {
              include: {
                products: true,
              },
            },
          },
        });

        // Deduct stock and record movement
        for (const item of requestedItems) {
          const prod = productMap.get(item.product_id)!;

          await tx.products.update({
            where: { id: item.product_id },
            data: {
              current_stock: { decrement: item.quantity },
            },
          });

          await tx.stock_movements.create({
            data: {
              product_id: item.product_id,
              quantity: item.quantity,
              movement_type: "OUT",
              reason: `Sale ${challanNumber}`,
              created_by: req.user?.id || null,
            },
          });

          await tx.sales.create({
            data: {
              challan_id: newChallan.id,
              customer_id: customerId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: prod.unit_price,
              total_amount: Number(prod.unit_price) * item.quantity,
            },
          });
        }

        return newChallan;
      }, { timeout: 30000, maxWait: 15000 });

      return res.status(201).json({
        success: true,
        message: "Sale created successfully",
        data: {
          id: sale.id,
          sale_number: sale.challan_number,
          challan_number: sale.challan_number,
          customer_id: sale.customer_id,
          customer: sale.customers,
          total_quantity: sale.total_quantity,
          total_amount: totalAmount,
          status: sale.status,
          created_at: sale.created_at,
          items: sale.challan_items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            unit_price: Number(item.unit_price),
            quantity: item.quantity,
            total: Number(item.unit_price) * item.quantity,
          })),
        },
      });
    } catch (error) {
      console.error("CREATE SALE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create sale",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);


/*
=====================================================
CANCEL SALE
PUT /api/sales/:id/cancel
=====================================================
*/

app.put(
  "/api/sales/:id/cancel",
  authenticateToken,
  allowRoles("ADMIN", "SALES"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sale ID",
        });
      }

      const existingSale = await prisma.challans.findUnique({
        where: { id },
        include: { challan_items: true },
      });

      if (!existingSale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      if (existingSale.status === "CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "Sale is already cancelled",
        });
      }

      await prisma.$transaction(async (tx) => {
        // Restore stock
        for (const item of existingSale.challan_items) {
          await tx.products.update({
            where: { id: item.product_id },
            data: {
              current_stock: { increment: item.quantity },
            },
          });

          await tx.stock_movements.create({
            data: {
              product_id: item.product_id,
              quantity: item.quantity,
              movement_type: "IN",
              reason: `Sale Cancelled ${existingSale.challan_number}`,
              created_by: req.user?.id || null,
            },
          });
        }

        await tx.challans.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
      }, { timeout: 30000, maxWait: 15000 });

      return res.json({
        success: true,
        message: "Sale cancelled successfully and stock restored",
      });
    } catch (error) {
      console.error("CANCEL SALE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel sale",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);


/*
=====================================================
DELETE SALE
DELETE /api/sales/:id
=====================================================
*/

app.delete(
  "/api/sales/:id",
  authenticateToken,
  allowRoles("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sale ID",
        });
      }

      const existingSale = await prisma.challans.findUnique({
        where: { id },
        include: { challan_items: true },
      });

      if (!existingSale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      await prisma.$transaction(async (tx) => {
        // If not cancelled yet, restore stock
        if (existingSale.status !== "CANCELLED") {
          for (const item of existingSale.challan_items) {
            await tx.products.update({
              where: { id: item.product_id },
              data: {
                current_stock: { increment: item.quantity },
              },
            });
          }
        }

        await tx.sales.deleteMany({
          where: { challan_id: id },
        });

        await tx.challan_items.deleteMany({
          where: { challan_id: id },
        });

        await tx.challans.delete({
          where: { id },
        });
      });

      return res.json({
        success: true,
        message: "Sale deleted successfully",
      });
    } catch (error) {
      console.error("DELETE SALE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete sale",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);


/*
=====================================================
DASHBOARD
=====================================================
*/

app.get(
  "/api/dashboard",
  authenticateToken,
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const [
        totalCustomers,
        activeCustomers,
        totalProducts,
        lowStockProducts,
        totalSales,
      ] =
        await Promise.all([
          prisma.customers.count(),

          prisma.customers.count({
            where: {
              status: "ACTIVE",
            },
          }),

          prisma.products.count(),

          prisma.products.count({
            where: {
              current_stock: {
                lte: 5,
              },
            },
          }),

          prisma.challans.count({
            where: {
              NOT: {
                challan_number:
                  {
                    startsWith:
                      "ORD-",
                  },
              },
            },
          }),
        ]);

      res.json({
        success: true,

        data: {
          totalCustomers,
          activeCustomers,
          totalProducts,
          lowStockProducts,
          totalSales,
        },
      });
    } catch (error) {
      console.error(
        "DASHBOARD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load dashboard",
      });
    }
  }
);


/*
=====================================================
REPORTS
=====================================================
*/

app.get(
  "/api/reports",
  authenticateToken,
  allowRoles("ADMIN"),
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const [
        customers,
        products,
        orders,
      ] =
        await Promise.all([
          prisma.customers.findMany({
            select: {
              id: true,
              name: true,
              status: true,
            },
          }),

          prisma.products.findMany({
            select: {
              id: true,
              name: true,
              current_stock:
                true,
              minimum_stock:
                true,
            },
          }),

          prisma.challans.findMany({
            include: {
              customers: true,
              challan_items: true,
            },

            orderBy: {
              id: "desc",
            },
          }),
        ]);

      let totalRevenue = 0;

      let totalQuantity = 0;

      let confirmedSales = 0;

      let draftSales = 0;

      let cancelledSales = 0;

      const productTotals =
        new Map<
          string,
          {
            quantity: number;
            revenue: number;
          }
        >();

      const customerTotals =
        new Map<
          string,
          {
            customer_name: string;
            orders: number;
            quantity: number;
            revenue: number;
          }
        >();

      for (const order of orders) {
        if (
          order.status ===
          "CONFIRMED"
        ) {
          confirmedSales++;
        }

        if (
          order.status ===
          "DRAFT"
        ) {
          draftSales++;
        }

        if (
          order.status ===
          "CANCELLED"
        ) {
          cancelledSales++;
        }

        if (
          order.status !==
          "CONFIRMED"
        ) {
          continue;
        }

        let orderRevenue = 0;

        for (const item of order.challan_items) {
          const revenue =
            Number(
              item.unit_price
            ) *
            item.quantity;

          orderRevenue +=
            revenue;

          const current =
            productTotals.get(
              item.product_name
            ) || {
              quantity: 0,
              revenue: 0,
            };

          current.quantity +=
            item.quantity;

          current.revenue +=
            revenue;

          productTotals.set(
            item.product_name,
            current
          );
        }

        totalQuantity +=
          order.total_quantity;

        totalRevenue +=
          orderRevenue;

        const customerId =
          String(
            order.customer_id
          );

        const currentCustomer =
          customerTotals.get(
            customerId
          ) || {
            customer_name:
              order.customers
                ?.name ||
              `Customer #${order.customer_id}`,

            orders: 0,
            quantity: 0,
            revenue: 0,
          };

        currentCustomer.orders++;

        currentCustomer.quantity +=
          order.total_quantity;

        currentCustomer.revenue +=
          orderRevenue;

        customerTotals.set(
          customerId,
          currentCustomer
        );
      }

      res.json({
        success: true,

        data: {
          totalCustomers:
            customers.length,

          activeCustomers:
            customers.filter(
              (customer) =>
                customer.status ===
                "ACTIVE"
            ).length,

          totalProducts:
            products.length,

          lowStockProducts:
            products.filter(
              (product) =>
                product.current_stock <=
                product.minimum_stock
            ).length,

          totalSales:
            orders.length,

          confirmedSales,

          draftSales,

          cancelledSales,

          totalQuantity,

          totalRevenue,

          topProducts:
            Array.from(
              productTotals.entries()
            )
              .map(
                ([
                  product_name,
                  value,
                ]) => ({
                  product_name,
                  ...value,
                })
              )
              .sort(
                (a, b) =>
                  b.revenue -
                  a.revenue
              ),

          topCustomers:
            Array.from(
              customerTotals.values()
            )
            .sort(
              (a, b) =>
                b.revenue -
                a.revenue
              ),

          recentSales:
            orders
              .slice(0, 10)
              .map((order) => ({
                id: order.id,
                challan_number: order.challan_number,
                customer_name: order.customers?.name || `Customer #${order.customer_id}`,
                status: order.status || "DRAFT",
                total_quantity: order.total_quantity,
                total_amount: order.challan_items.reduce(
                  (sum, item) => sum + Number(item.unit_price) * item.quantity,
                  0
                ),
                created_at: order.created_at,
              })),
        },
      });
    } catch (error) {
      console.error(
        "REPORTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate reports",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);


/*
=====================================================
404
=====================================================
*/

app.use(
  (
    _req: Request,
    res: Response
  ) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found",
    });
  }
);


/*
=====================================================
GLOBAL ERROR HANDLER
=====================================================
*/

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
);


/*
=====================================================
START SERVER
=====================================================
*/

async function startServer() {
  const dbInfo = getResolvedDbConfig();
  console.log(`🔌 Attempting to connect to MySQL database at ${dbInfo.host}:${dbInfo.port} (${dbInfo.database})...`);

  try {
    /*
     * Test database connection
     */
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ Database connected successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on Port ${PORT}`);
    });
  } catch (error: any) {
    console.error("\n❌ Database connection failed!");
    console.error("=================================================");
    console.error(`Target Database : ${dbInfo.database}`);
    console.error(`Target Host     : ${dbInfo.host}:${dbInfo.port}`);
    console.error(`User            : ${dbInfo.user}`);
    console.error(`Error Code      : ${error?.code || "UNKNOWN"}`);
    console.error(`Error Message   : ${error?.message || String(error)}`);
    console.error("=================================================");

    if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      console.error("💡 Cause: MySQL server is not running on the specified host/port.");
      console.error("   Fix  : If using local MySQL, start the MySQL Windows service (MYSQL80) or MySQL daemon.");
    } else if (error?.code === "ER_ACCESS_DENIED_ERROR" || error?.message?.includes("Access denied")) {
      console.error("💡 Cause: Incorrect MySQL username or password in .env.");
      console.error("   Fix  : Check DATABASE_USER and DATABASE_PASSWORD in Backend/.env.");
    } else if (error?.code === "ER_BAD_DB_ERROR" || error?.message?.includes("Unknown database")) {
      console.error(`💡 Cause: Database '${dbInfo.database}' does not exist.`);
      console.error(`   Fix  : Create the database in MySQL: CREATE DATABASE ${dbInfo.database};`);
    } else if (dbInfo.host.includes(".railway.internal")) {
      console.error("💡 Cause: '*.railway.internal' is a private Railway internal domain.");
      console.error("   Fix  : When running locally, use the Public Railway TCP Proxy URL from Railway Dashboard.");
    }
    console.error("=================================================\n");

    process.exit(1);
  }
}


/*
=====================================================
GRACEFUL SHUTDOWN
=====================================================
*/

process.on(
  "SIGINT",
  async () => {
    await prisma.$disconnect();

    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  async () => {
    await prisma.$disconnect();

    process.exit(0);
  }
);


startServer();
