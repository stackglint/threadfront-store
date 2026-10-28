export const ORDER_STATUSES = ["placed", "paid", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  placed: ["paid", "packed", "cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canMove = (from: OrderStatus, to: OrderStatus) => NEXT[from].includes(to);
export const nextSteps = (from: OrderStatus) => NEXT[from];

/** Cancelling puts the units back on the shelf; only possible before shipping. */
export const restocksOnCancel = (from: OrderStatus) => from === "placed" || from === "paid" || from === "packed";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed", paid: "Paid", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

/** The customer-facing progress steps. */
export const TRACK_STEPS: OrderStatus[] = ["placed", "packed", "shipped", "delivered"];

export function orderNumber(seq: number): string {
  return `SS-${String(seq).padStart(5, "0")}`;
}
