import { prisma } from './prisma'
import { SubscriptionPlan, SubscriptionStatus, Subscription } from '@prisma/client'

export const PLANS = {
  FREE: {
    id: 'FREE' as SubscriptionPlan,
    name: 'Free',
    price: 0,
    features: [
      '1 Slack workspace',
      'Basic AI summaries',
      '10 summaries per month',
      'Email support'
    ],
    limits: {
      workspaces: 1,
      summariesPerMonth: 10
    }
  },
  PRO: {
    id: 'PRO' as SubscriptionPlan,
    name: 'Pro',
    price: 29,
    features: [
      '3 Slack workspaces',
      'Advanced AI summaries',
      'Unlimited summaries',
      'Priority support',
      'Export to PDF/Notion'
    ],
    limits: {
      workspaces: 3,
      summariesPerMonth: -1 // unlimited
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE' as SubscriptionPlan,
    name: 'Enterprise',
    price: 99,
    features: [
      'Unlimited Slack workspaces',
      'Advanced AI with custom models',
      'Unlimited summaries',
      '24/7 priority support',
      'Custom integrations',
      'Team management',
      'Advanced analytics'
    ],
    limits: {
      workspaces: -1, // unlimited
      summariesPerMonth: -1 // unlimited
    }
  }
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  cashfreeOrderId: string,
  cashfreePaymentId?: string
): Promise<Subscription> {
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  return prisma.subscription.create({
    data: {
      userId,
      plan,
      status: 'ACTIVE',
      cashfreeOrderId,
      cashfreePaymentId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd
    }
  })
}

export async function updateSubscriptionStatus(
  cashfreeOrderId: string,
  status: SubscriptionStatus,
  cashfreePaymentId?: string
): Promise<Subscription | null> {
  return prisma.subscription.update({
    where: {
      cashfreeOrderId
    },
    data: {
      status,
      ...(cashfreePaymentId && { cashfreePaymentId })
    }
  })
}

export function getUserPlan(subscription: Subscription | null): SubscriptionPlan {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return 'FREE'
  }
  return subscription.plan
}

export async function getUserUsage(userId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [summariesThisMonth, workspacesConnected] = await Promise.all([
    prisma.summary.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    }),
    prisma.slackToken.count({
      where: {
        userId
      }
    })
  ])

  return {
    summariesThisMonth,
    workspacesConnected
  }
}

export function checkUsageLimits(plan: SubscriptionPlan, usage: { summariesThisMonth: number, workspacesConnected: number }) {
  const planConfig = PLANS[plan]

  return {
    canCreateSummary: planConfig.limits.summariesPerMonth === -1 || usage.summariesThisMonth < planConfig.limits.summariesPerMonth,
    canConnectWorkspace: planConfig.limits.workspaces === -1 || usage.workspacesConnected < planConfig.limits.workspaces,
    summariesRemaining: planConfig.limits.summariesPerMonth === -1 ? -1 : Math.max(0, planConfig.limits.summariesPerMonth - usage.summariesThisMonth),
    workspacesRemaining: planConfig.limits.workspaces === -1 ? -1 : Math.max(0, planConfig.limits.workspaces - usage.workspacesConnected)
  }
}

export async function cancelSubscription(userId: string): Promise<Subscription | null> {
  const subscription = await getUserSubscription(userId)
  
  if (!subscription) {
    return null
  }

  return prisma.subscription.update({
    where: {
      id: subscription.id
    },
    data: {
      cancelAtPeriodEnd: true
    }
  })
}

// Duplicate function removed - using the first declaration above

export function canAccessFeature(
  subscription: Subscription | null,
  feature: 'workspaces' | 'summaries'
): boolean {
  const plan = getUserPlan(subscription)
  const planConfig = PLANS[plan]

  if (feature === 'workspaces') {
    return planConfig.limits.workspaces === -1 // unlimited
  }

  if (feature === 'summaries') {
    return planConfig.limits.summariesPerMonth === -1 // unlimited
  }

  return false
}

// Duplicate function removed - using the first declaration above
