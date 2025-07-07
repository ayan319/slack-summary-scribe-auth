// Simple in-memory user store for demo purposes
// In production, replace this with a real database (Supabase, PostgreSQL, etc.)

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  orderId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderId: string;
  userId?: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
  customerEmail: string;
  customerName: string;
  paymentMethod?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory stores (replace with database in production)
const users = new Map<string, User>();
const subscriptions = new Map<string, Subscription>();
const orders = new Map<string, Order>();
const usersByEmail = new Map<string, string>(); // email -> userId mapping

// User management functions
export function createUser(userData: {
  email: string;
  name: string;
}): User {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user: User = {
    id: userId,
    email: userData.email,
    name: userData.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.set(userId, user);
  usersByEmail.set(userData.email, userId);
  
  return user;
}

export function getUserById(userId: string): User | null {
  return users.get(userId) || null;
}

export function getUserByEmail(email: string): User | null {
  const userId = usersByEmail.get(email);
  return userId ? users.get(userId) || null : null;
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
  const user = users.get(userId);
  if (!user) return null;
  
  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date(),
  };
  
  users.set(userId, updatedUser);
  return updatedUser;
}

// Subscription management functions
export function createSubscription(subscriptionData: {
  userId: string;
  planId: string;
  orderId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  durationMonths?: number;
}): Subscription {
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (subscriptionData.durationMonths || 1));
  
  const subscription: Subscription = {
    id: subscriptionId,
    userId: subscriptionData.userId,
    planId: subscriptionData.planId,
    status: 'active',
    orderId: subscriptionData.orderId,
    paymentId: subscriptionData.paymentId,
    amount: subscriptionData.amount,
    currency: subscriptionData.currency,
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  subscriptions.set(subscriptionId, subscription);
  return subscription;
}

export function getActiveSubscription(userId: string): Subscription | null {
  for (const subscription of subscriptions.values()) {
    if (
      subscription.userId === userId && 
      subscription.status === 'active' &&
      (!subscription.endDate || subscription.endDate > new Date())
    ) {
      return subscription;
    }
  }
  return null;
}

export function updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Subscription | null {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) return null;
  
  const updatedSubscription = {
    ...subscription,
    ...updates,
    updatedAt: new Date(),
  };
  
  subscriptions.set(subscriptionId, updatedSubscription);
  return updatedSubscription;
}

export function cancelSubscription(userId: string): boolean {
  const subscription = getActiveSubscription(userId);
  if (!subscription) return false;
  
  updateSubscription(subscription.id, { status: 'cancelled' });
  return true;
}

// Order management functions
export function createOrder(orderData: {
  orderId: string;
  userId?: string;
  planId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  status?: Order['status'];
}): Order {
  const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const order: Order = {
    id,
    orderId: orderData.orderId,
    userId: orderData.userId,
    planId: orderData.planId,
    amount: orderData.amount,
    currency: orderData.currency,
    status: orderData.status || 'ACTIVE',
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  orders.set(orderData.orderId, order);
  return order;
}

export function getOrderById(orderId: string): Order | null {
  return orders.get(orderId) || null;
}

export function updateOrder(orderId: string, updates: Partial<Order>): Order | null {
  const order = orders.get(orderId);
  if (!order) return null;
  
  const updatedOrder = {
    ...order,
    ...updates,
    updatedAt: new Date(),
  };
  
  orders.set(orderId, updatedOrder);
  return updatedOrder;
}

// Helper functions
export function hasActiveSubscription(userId: string): boolean {
  const subscription = getActiveSubscription(userId);
  return subscription !== null;
}

export function getUserPlan(userId: string): string {
  const subscription = getActiveSubscription(userId);
  return subscription?.planId || 'FREE';
}

export function isSubscriptionExpired(subscription: Subscription): boolean {
  if (!subscription.endDate) return false;
  return subscription.endDate < new Date();
}

// Payment processing functions
export function processSuccessfulPayment(data: {
  orderId: string;
  paymentId: string;
  paymentMethod?: string;
}): { user: User | null; subscription: Subscription | null } {
  const order = getOrderById(data.orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Update order status
  updateOrder(data.orderId, {
    status: 'PAID',
    paymentMethod: data.paymentMethod,
  });
  
  // Get or create user
  let user = order.userId ? getUserById(order.userId) : null;
  if (!user) {
    user = getUserByEmail(order.customerEmail);
    if (!user) {
      user = createUser({
        email: order.customerEmail,
        name: order.customerName,
      });
    }
  }
  
  // Create or update subscription
  const existingSubscription = getActiveSubscription(user.id);
  let subscription: Subscription;
  
  if (existingSubscription) {
    // Extend existing subscription
    const newEndDate = new Date(existingSubscription.endDate || new Date());
    newEndDate.setMonth(newEndDate.getMonth() + 1);
    
    subscription = updateSubscription(existingSubscription.id, {
      endDate: newEndDate,
      orderId: data.orderId,
      paymentId: data.paymentId,
    })!;
  } else {
    // Create new subscription
    subscription = createSubscription({
      userId: user.id,
      planId: order.planId,
      orderId: data.orderId,
      paymentId: data.paymentId,
      amount: order.amount,
      currency: order.currency,
    });
  }
  
  return { user, subscription };
}

// Debug functions (remove in production)
export function getAllUsers(): User[] {
  return Array.from(users.values());
}

export function getAllSubscriptions(): Subscription[] {
  return Array.from(subscriptions.values());
}

export function getAllOrders(): Order[] {
  return Array.from(orders.values());
}

export function clearAllData(): void {
  users.clear();
  subscriptions.clear();
  orders.clear();
  usersByEmail.clear();
}
