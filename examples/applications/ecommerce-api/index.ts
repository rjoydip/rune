import { createApp, Context, NextFunction } from "@rune/core";
import {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Deps,
} from "@rune/decorators";
import { MemoryCache } from "@rune/cache";
import { ConsoleLogger } from "@rune/logger";
import { NoopTelemetry } from "@rune/telemetry";

class CreateProductDto {
  name!: string;
  price!: number;
  description!: string;
  stock!: number;
  category!: string;
}

class UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  stock?: number;
  category?: string;
}

class AddToCartDto {
  productId!: string;
  quantity!: number;
}

class ProductService {
  private products = new Map<string, any>();

  async createProduct(data: CreateProductDto): Promise<any> {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const product = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(id, product);
    return product;
  }

  async getProduct(id: string): Promise<any> {
    return this.products.get(id) || null;
  }

  async getProducts(category?: string): Promise<any[]> {
    let products = Array.from(this.products.values());
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    return products;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<any> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error("Product not found");
    }
    const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  clearState(): void {
    this.products.clear();
  }
}

class CartService {
  private carts = new Map<string, any>();

  async addToCart(userId: string, productId: string, quantity: number): Promise<any> {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, { userId, items: [] });
    }
    const cart = this.carts.get(userId);
    const existingItem = cart.items.find((i: any) => i.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    return cart;
  }

  async removeFromCart(userId: string, productId: string): Promise<any> {
    const cart = this.carts.get(userId);
    if (!cart) return null;
    cart.items = cart.items.filter((i: any) => i.productId !== productId);
    return cart;
  }

  async getCart(userId: string): Promise<any> {
    return this.carts.get(userId) || { userId, items: [] };
  }

  async checkout(userId: string): Promise<any> {
    const cart = this.carts.get(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }
    const order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      items: [...cart.items],
      total: 0,
      createdAt: new Date().toISOString(),
    };
    this.carts.delete(userId);
    return order;
  }

  clearState(): void {
    this.carts.clear();
  }
}

class AuthMiddleware {
  private readonly token = "ecommerce-secret-token-2024";

  async use(ctx: Context, next: NextFunction): Promise<void> {
    const authHeader = ctx.request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.send({ error: "Authentication required" }, 401);
      return;
    }
    const token = authHeader.substring(7);
    if (token !== this.token) {
      ctx.send({ error: "Invalid authentication token" }, 401);
      return;
    }
    ctx.state.set("user", { id: "user-123", role: "admin" });
    await next();
  }
}

@Deps(ProductService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class ProductController {
  constructor(
    private productService: ProductService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/products")
  @Body(CreateProductDto)
  async createProduct(body: CreateProductDto): Promise<Response> {
    const span = this.telemetry.startSpan("createProduct", { category: body.category });
    try {
      const product = await this.productService.createProduct(body);
      await this.cache.set(`product:${product.id}`, product, 300);
      this.logger.info("Product created", { id: product.id, category: product.category });
      span.setAttribute("product.id", product.id);
      span.end();
      return new Response(JSON.stringify(product), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/products/:id")
  @Param()
  async getProduct(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("getProduct", { productId: id });
    try {
      let product = await this.cache.get<any>(`product:${id}`);
      if (!product) {
        product = await this.productService.getProduct(id);
        if (!product) {
          return new Response("Not Found", { status: 404 });
        }
        await this.cache.set(`product:${id}`, product, 300);
      }
      span.setAttribute("product.id", id);
      span.end();
      return new Response(JSON.stringify(product), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/products")
  @Query()
  async getProducts(category?: string): Promise<Response> {
    const span = this.telemetry.startSpan("getProducts", { category });
    try {
      const cacheKey = `products:list:category=${category || "all"}`;
      let products = await this.cache.get<any[]>(cacheKey);
      if (!products) {
        products = await this.productService.getProducts(category);
        await this.cache.set(cacheKey, products, 60);
      }
      span.setAttribute("product.count", products.length);
      span.end();
      return new Response(JSON.stringify(products), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Put("/products/:id")
  @Param()
  @Body(UpdateProductDto)
  async updateProduct(id: string, body: UpdateProductDto): Promise<Response> {
    const span = this.telemetry.startSpan("updateProduct", { productId: id });
    try {
      const product = await this.productService.updateProduct(id, body);
      await this.cache.set(`product:${product.id}`, product, 300);
      this.logger.info("Product updated", { id });
      span.setAttribute("product.id", id);
      span.end();
      return new Response(JSON.stringify(product), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Delete("/products/:id")
  @Param()
  async deleteProduct(id: string): Promise<Response> {
    const span = this.telemetry.startSpan("deleteProduct", { productId: id });
    try {
      const success = await this.productService.deleteProduct(id);
      await this.cache.delete(`product:${id}`);
      this.logger.info("Product deleted", { id });
      span.setAttribute("product.id", id);
      span.end();
      return new Response(JSON.stringify({ success }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }
}

@Deps(CartService, ProductService, MemoryCache, ConsoleLogger, NoopTelemetry)
@Controller("/api/v1")
class CartController {
  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private cache: MemoryCache,
    private logger: ConsoleLogger,
    private telemetry: NoopTelemetry,
  ) {}

  @Post("/cart/items")
  @Body(AddToCartDto)
  async addToCart(body: AddToCartDto): Promise<Response> {
    const span = this.telemetry.startSpan("addToCart", { productId: body.productId });
    try {
      const product = await this.productService.getProduct(body.productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      const cart = await this.cartService.addToCart("user-123", body.productId, body.quantity);
      this.logger.info("Item added to cart", { userId: "user-123", productId: body.productId });
      span.setAttribute("cart.userId", "user-123");
      span.end();
      return new Response(JSON.stringify(cart), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Delete("/cart/items/:productId")
  @Param()
  async removeFromCart(productId: string): Promise<Response> {
    const span = this.telemetry.startSpan("removeFromCart", { productId });
    try {
      const cart = await this.cartService.removeFromCart("user-123", productId);
      this.logger.info("Item removed from cart", { userId: "user-123", productId });
      span.setAttribute("cart.userId", "user-123");
      span.end();
      return new Response(JSON.stringify(cart), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Get("/cart")
  async getCart(): Promise<Response> {
    const span = this.telemetry.startSpan("getCart", {});
    try {
      const cart = await this.cartService.getCart("user-123");
      span.setAttribute("cart.userId", "user-123");
      span.end();
      return new Response(JSON.stringify(cart), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }

  @Post("/cart/checkout")
  async checkout(): Promise<Response> {
    const span = this.telemetry.startSpan("checkout", {});
    try {
      const order = await this.cartService.checkout("user-123");
      await this.cache.set(`order:${order.id}`, order, 300);
      this.logger.info("Checkout completed", { userId: "user-123", orderId: order.id });
      span.setAttribute("order.id", order.id);
      span.end();
      return new Response(JSON.stringify(order), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      throw error;
    }
  }
}

@Module({
  controllers: [ProductController, CartController],
  providers: [
    AuthMiddleware,
    ProductService,
    CartService,
    MemoryCache,
    ConsoleLogger,
    NoopTelemetry,
  ],
  imports: [],
  exports: [],
})
class EcommerceModule {}

const app = createApp();

const authMiddleware = new AuthMiddleware();
app.use(async (ctx: Context, next: NextFunction) => {
  await authMiddleware.use(ctx, next);
});

app.use(async (ctx: Context, next: NextFunction) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

app.use(async (ctx: Context, next: NextFunction) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Request completed in ${duration}ms`);
});

app.registerModule(EcommerceModule);

export function resetState() {
  const productService = app.container.resolve(ProductService);
  const cartService = app.container.resolve(CartService);
  productService.clearState();
  cartService.clearState();
}

export default app;
