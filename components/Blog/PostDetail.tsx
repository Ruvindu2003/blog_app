'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, Crown, CreditCard, Lock, ArrowLeft } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  is_premium: boolean;
  created_at: string;
  author_id: string;
}

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (postId) {
      fetchPost();
      checkUser();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status')
        .maybeSingle();

      setHasSubscription(data?.subscription_status === 'active');
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: 'price_1RlP9NRq8gaO9d2HAXe7r172',
          success_url: `${window.location.origin}/success`,
          cancel_url: window.location.href,
          mode: 'subscription',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The post you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => router.push('/blog')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canViewContent = !post.is_premium || hasSubscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/blog')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>

          <Card>
            <CardHeader>
              <div className="space-y-4">
                {post.is_premium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 w-fit">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium Content
                  </Badge>
                )}
                
                <CardTitle className="text-3xl font-bold">
                  {post.title}
                </CardTitle>
                
                {post.excerpt && (
                  <CardDescription className="text-lg">
                    {post.excerpt}
                  </CardDescription>
                )}
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Published on {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Separator className="mb-6" />
              
              {canViewContent ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {post.content}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Premium Content
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      This content is available to premium subscribers only. 
                      Subscribe now to unlock this post and all premium content.
                    </p>
                  </div>

                  <Card className="max-w-md mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">Premium Subscription</CardTitle>
                      <CardDescription>
                        Get access to all premium content
                      </CardDescription>
                      <div className="text-3xl font-bold text-gray-900">
                        $5.00<span className="text-sm font-normal text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {user ? (
                        <Button 
                          onClick={handleSubscribe}
                          disabled={checkoutLoading}
                          className="w-full"
                        >
                          {checkoutLoading ? (
                            'Processing...'
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Subscribe Now
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 text-center">
                            Please log in to subscribe
                          </p>
                          <Button
                            onClick={() => router.push('/auth/login')}
                            className="w-full"
                          >
                            Login to Subscribe
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}