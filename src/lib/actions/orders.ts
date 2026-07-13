"use server";

import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/utils";

export async function createOrder(formData: FormData, items: { product_id: string; product_name: string; quantity: number; unit_price: number }[]) {
  const supabase = await createClient();

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const shippingCost = parseFloat(formData.get("shipping_cost") as string) || 50;
  const total = subtotal + shippingCost;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      status: "pending",
      customer_name: formData.get("customer_name") as string,
      customer_phone: formData.get("customer_phone") as string,
      customer_email: (formData.get("customer_email") as string) || null,
      customer_address: formData.get("customer_address") as string,
      customer_city: formData.get("customer_city") as string,
      payment_method: formData.get("payment_method") as string,
      payment_status: formData.get("payment_method") === "cod" ? "pending" : "pending",
      subtotal,
      shipping_cost: shippingCost,
      total,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // Insert order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw new Error(itemsError.message);

  // Update stock quantities
  for (const item of items) {
    const { error } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    // Ignore error if RPC doesn't exist
  }

  return order;
}

export async function getOrders(filters?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters?.search) {
    query = query.or(
      `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getOrderByNumber(orderNumber: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .single();

  if (error) return null;
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateOrderNotes(id: string, notes: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: notes })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
