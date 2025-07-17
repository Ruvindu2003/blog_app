'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { getProductByPriceId } from '@/src/stripe-config';

interface UserSubscription {
  subscription_status: string;
  price_id: string | null;
}

export default function SuccessPage() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      // Wait a moment for webhook to process
      setTimeout(async () => {
        await fetchSubscription();
        setLoading(false);
      }, 2000);
    };

    checkAuth();
  }, [router, supabase.auth]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription?.price_id) return null;
    return getProductByPriceId(subscription.price_id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      trialing: { variant: 'secondary' as const, label: 'Trial' },
      not_started: { variant: 'outline' as const, label: 'Processing' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: 'outline' as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <h2 className="text-xl font-semibold">Processing your payment...</h2>
              <p className="text-gray-600">Please wait while we confirm your purchase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Thank you for your purchase. Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPlan && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Plan:</span>
                <span className="text-gray-900">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Price:</span>
                <span className="text-gray-900">
                  ${currentPlan.price.toFixed(2)}
                  {currentPlan.mode === 'subscription' && '/month'}
                </span>
              </div>
              {subscription && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(subscription.subscription_status)}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              If you have any questions about your purchase, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}