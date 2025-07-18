'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, User, LogOut, Crown, AlertTriangle } from 'lucide-react';
import { STRIPE_PRODUCTS, getProductByPriceId } from '@/src/stripe-config';

interface UserSubscription {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
        await fetchSubscription(user.id);
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Failed to authenticate user');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase.auth]);

  const fetchSubscription = async (userId?: string) => {
    try {
      setError('');
      
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        currentUserId = user.id;
      }

      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setSubscription(data);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to load subscription data');
    }
  };

  const handleCheckout = async (priceId: string, mode: 'payment' | 'subscription') => {
    setCheckoutLoading(priceId);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const stripeCheckoutUrl = 'https://buy.stripe.com/test_00wdRbcrS1gq1ru6xm7EQ00';
      if (priceId === STRIPE_PRODUCTS.find(product => product.priceId === priceId)?.priceId) {
        window.location.href = stripeCheckoutUrl;
        return;
      }

      try {
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`;
        
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: `${window.location.origin}/success`,
            cancel_url: `${window.location.origin}/dashboard`,
            mode,
          }),
        });

        if (!response.ok) {
          throw new Error(`Edge function failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        
        throw new Error('No checkout URL received from edge function');
      } catch (edgeError) {
        console.warn('Edge function failed, trying API route:', edgeError);
        
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: `${window.location.origin}/success`,
            cancel_url: `${window.location.origin}/dashboard`,
            mode,
            user_id: user?.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch((e) => ({ error: 'Network error : ' , e }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Sign out error:', err);
      router.push('/auth/login');
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      trialing: { variant: 'secondary' as const, label: 'Trial' },
      past_due: { variant: 'destructive' as const, label: 'Past Due' },
      canceled: { variant: 'outline' as const, label: 'Canceled' },
      incomplete: { variant: 'destructive' as const, label: 'Incomplete' },
      not_started: { variant: 'outline' as const, label: 'No Subscription' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: 'outline' as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCurrentPlan = () => {
    if (!subscription?.price_id) return null;
    return getProductByPriceId(subscription.price_id);
  };

  const retryFetchSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchSubscription();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-blue-800">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
            <p className="text-blue-700 mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
          >
            <LogOut className="h-4 w-4 mr-2 text-blue-600" />
            Sign Out
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="flex items-center justify-between text-red-700">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={retryFetchSubscription}
                className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <User className="h-5 w-5 text-blue-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Email</p>
                <p className="text-blue-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">User ID</p>
                <p className="text-blue-900 text-sm font-mono">{user?.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Account Status</p>
                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Crown className="h-5 w-5 text-blue-600" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-blue-900">
                    {currentPlan ? currentPlan.name : 'No active subscription'}
                  </p>
                  {subscription && getSubscriptionStatusBadge(subscription.subscription_status)}
                </div>
              </div>
              
              {subscription?.current_period_end && (
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on
                  </p>
                  <p className="text-blue-900">
                    {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription?.payment_method_brand && subscription?.payment_method_last4 && (
                <div>
                  <p className="text-sm font-medium text-blue-600">Payment Method</p>
                  <p className="text-blue-900 capitalize">
                    {subscription.payment_method_brand} ending in {subscription.payment_method_last4}
                  </p>
                </div>
              )}

              {!subscription && !error && (
                <div>
                  <p className="text-sm text-blue-600">No subscription found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STRIPE_PRODUCTS.map((product) => {
              const isCurrentPlan = currentPlan?.id === product.id;
              const isSubscribed = subscription?.subscription_status === 'active' && isCurrentPlan;
              
              return (
                <Card 
                  key={product.id} 
                  className={`bg-white border-blue-200 shadow-sm transition-all hover:shadow-md ${
                    isCurrentPlan ? 'ring-2 ring-blue-500 border-blue-300' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-blue-900">{product.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Current</Badge>
                      )}
                    </div>
                    <CardDescription className="text-blue-700">
                      {product.description || 'Premium features and benefits'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-blue-900">
                          ${product.price.toFixed(2)}
                          <span className="text-sm font-normal text-blue-600">
                            /{product.mode === 'subscription' ? 'month' : 'one-time'}
                          </span>
                        </p>
                      </div>
                      
                      <Separator className="bg-blue-200" />
                      
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleCheckout(product.priceId, product.mode)}
                        disabled={checkoutLoading === product.priceId || isSubscribed}
                      >
                        {checkoutLoading === product.priceId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isSubscribed ? (
                          'Subscribed'
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {product.mode === 'subscription' ? 'Subscribe' : 'Purchase'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}