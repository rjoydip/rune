import { describe, it, expect, beforeEach } from "bun:test";
import app, { resetState } from "../index";

describe("ecommerce-api", () => {
  beforeEach(() => {
    resetState();
  });

  it("creates a product", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Wireless Mouse",
          price: 29.99,
          description: "Ergonomic wireless mouse",
          stock: 100,
          category: "electronics",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe("Wireless Mouse");
    expect(data.price).toBe(29.99);
    expect(data.category).toBe("electronics");
  });

  it("gets a product by ID", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Mechanical Keyboard",
          price: 89.99,
          description: "RGB mechanical keyboard",
          stock: 50,
          category: "electronics",
        }),
      }),
    );
    const created = await createRes.json();

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/products/${created.id}`, {
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe("Mechanical Keyboard");
  });

  it("lists products with category filter", async () => {
    await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Laptop",
          price: 999.99,
          description: "Gaming laptop",
          stock: 10,
          category: "electronics",
        }),
      }),
    );
    await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "T-shirt",
          price: 19.99,
          description: "Cotton t-shirt",
          stock: 200,
          category: "clothing",
        }),
      }),
    );

    const getRes = await app.fetch(
      new Request("http://localhost/api/v1/products?category=electronics", {
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].category).toBe("electronics");
  });

  it("updates a product", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Old Monitor",
          price: 199.99,
          description: "Old monitor",
          stock: 5,
          category: "electronics",
        }),
      }),
    );
    const created = await createRes.json();

    const updateRes = await app.fetch(
      new Request(`http://localhost/api/v1/products/${created.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          price: 149.99,
          stock: 20,
        }),
      }),
    );
    expect(updateRes.status).toBe(200);
    const data = await updateRes.json();
    expect(data.id).toBe(created.id);
    expect(data.price).toBe(149.99);
    expect(data.stock).toBe(20);
    expect(data.name).toBe("Old Monitor");
  });

  it("deletes a product", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "To be deleted",
          price: 9.99,
          description: "Will be deleted",
          stock: 1,
          category: "misc",
        }),
      }),
    );
    const created = await createRes.json();

    const deleteRes = await app.fetch(
      new Request(`http://localhost/api/v1/products/${created.id}`, {
        method: "DELETE",
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(deleteRes.status).toBe(200);
    const data = await deleteRes.json();
    expect(data.success).toBe(true);

    const getRes = await app.fetch(
      new Request(`http://localhost/api/v1/products/${created.id}`, {
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(getRes.status).toBe(404);
  });

  it("adds item to cart", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "USB Cable",
          price: 12.99,
          description: "USB-C cable",
          stock: 500,
          category: "electronics",
        }),
      }),
    );
    const product = await createRes.json();

    const cartRes = await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 2,
        }),
      }),
    );
    expect(cartRes.status).toBe(200);
    const cart = await cartRes.json();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(product.id);
    expect(cart.items[0].quantity).toBe(2);
  });

  it("removes item from cart", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "HDMI Cable",
          price: 15.99,
          description: "HDMI 2.1 cable",
          stock: 300,
          category: "electronics",
        }),
      }),
    );
    const product = await createRes.json();

    await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      }),
    );

    const removeRes = await app.fetch(
      new Request(`http://localhost/api/v1/cart/items/${product.id}`, {
        method: "DELETE",
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(removeRes.status).toBe(200);
    const cart = await removeRes.json();
    expect(cart.items).toHaveLength(0);
  });

  it("checkout creates order from cart", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Desk Lamp",
          price: 49.99,
          description: "LED desk lamp",
          stock: 75,
          category: "home",
        }),
      }),
    );
    const product = await createRes.json();

    await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      }),
    );

    const checkoutRes = await app.fetch(
      new Request("http://localhost/api/v1/cart/checkout", {
        method: "POST",
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(checkoutRes.status).toBe(200);
    const order = await checkoutRes.json();
    expect(order.id).toBeDefined();
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productId).toBe(product.id);

    const cartRes = await app.fetch(
      new Request("http://localhost/api/v1/cart", {
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    const cart = await cartRes.json();
    expect(cart.items).toHaveLength(0);
  });

  it("returns 401 for invalid token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          name: "Test",
          price: 10,
          description: "Test",
          stock: 1,
          category: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing auth header", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Test",
          price: 10,
          description: "Test",
          stock: 1,
          category: "test",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("increments quantity when adding existing product to cart", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/v1/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({
          name: "Test Item",
          price: 10,
          description: "For cart increment test",
          stock: 100,
          category: "test",
        }),
      }),
    );
    const product = await createRes.json();

    await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      }),
    );

    const cartRes2 = await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({ productId: product.id, quantity: 3 }),
      }),
    );
    expect(cartRes2.status).toBe(200);
    const cart = await cartRes2.json();
    expect(cart.items[0].quantity).toBe(4);
  });

  it("returns 404 when adding non-existent product to cart", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({ productId: "non-existent-product", quantity: 1 }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 when updating non-existent product", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/products/non-existent", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ecommerce-secret-token-2024",
        },
        body: JSON.stringify({ price: 10 }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 when checking out with empty cart", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/v1/cart/checkout", {
        method: "POST",
        headers: { authorization: "Bearer ecommerce-secret-token-2024" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
