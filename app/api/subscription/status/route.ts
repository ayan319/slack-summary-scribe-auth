import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no active subscription, return FREE plan
    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          features: PLANS.FREE.features,
          limits: PLANS.FREE.limits,
          currentPeriodEnd: null,
          isActive: true,
          canUpgrade: true
        }
      });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired = subscription.currentPeriodEnd && subscription.currentPeriodEnd < now;

    if (isExpired) {
      // Update subscription to expired
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELED' }
      });

      return NextResponse.json({
        success: true,
        subscription: {
          plan: 'FREE',
          status: 'EXPIRED',
          features: PLANS.FREE.features,
          limits: PLANS.FREE.limits,
          currentPeriodEnd: subscription.currentPeriodEnd,
          isActive: false,
          canUpgrade: true,
          expiredPlan: subscription.plan
        }
      });
    }

    // Get plan details
    const planDetails = PLANS[subscription.plan];
    
    // Calculate days until renewal
    const daysUntilRenewal = subscription.currentPeriodEnd 
      ? Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        features: planDetails.features,
        limits: planDetails.limits,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysUntilRenewal,
        isActive: subscription.status === 'ACTIVE',
        canUpgrade: subscription.plan !== 'ENTERPRISE',
        canDowngrade: subscription.plan !== 'FREE',
        cashfreeOrderId: subscription.cashfreeOrderId,
        cashfreePaymentId: subscription.cashfreePaymentId
      }
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      // Cancel current subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { success: false, error: 'No active subscription found' },
          { status: 404 }
        );
      }

      // Update subscription to cancelled
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
