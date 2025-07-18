'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Star, ArrowRight, CreditCard, Shield, Zap, Sparkles, Users, Globe } from 'lucide-react';
import { STRIPE_PRODUCTS } from '@/src/stripe-config';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase.auth]);

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-100/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                <Star className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-2xl font-bold text-gray-900">ProductApp</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-20 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : user ? (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 relative bg-white">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-600 border-blue-200 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              ✨ New Features Available
            </Badge>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight text-gray-900">
              Unlock Premium
              <br />
              <span className="text-blue-600 animate-pulse">
                Features
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Experience the full potential of our platform with premium subscriptions. 
              Get access to advanced features, priority support, and exclusive content.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="text-lg px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-lg px-10 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technology and designed for performance, security, and scalability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized for speed and performance with modern web technologies.",
                color: "bg-blue-600"
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Enterprise-grade security with 99.9% uptime guarantee.",
                color: "bg-blue-600"
              },
              {
                icon: Users,
                title: "Easy to Use",
                description: "Intuitive interface designed for both beginners and professionals.",
                color: "bg-blue-600"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-all duration-300">
                <div className={`w-20 h-20 ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-6`}>
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white relative">
        <div className="container mx-auto text-center relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { number: "50K+", label: "Happy Customers" },
              { number: "99.9%", label: "Uptime" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-blue-600">{stat.number}</div>
                <div className="text-gray-600 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-gray-50 relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for you. All plans include our core features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {STRIPE_PRODUCTS.map((product, index) => (
              <Card key={product.id} className={`relative bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group ${index === 1 ? 'ring-2 ring-blue-600 scale-105' : ''}`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white shadow-md px-4 py-2">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</CardTitle>
                  <CardDescription className="min-h-[3rem] flex items-center justify-center text-gray-600 text-lg">
                    {product.description || 'Premium features and benefits for enhanced productivity'}
                  </CardDescription>
                  <div className="py-6">
                    <span className="text-5xl md:text-6xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600 text-lg ml-2">
                      /{product.mode === 'subscription' ? 'month' : 'one-time'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 mb-8">
                    {[
                      "Access to all premium features",
                      "Priority customer support",
                      "Advanced analytics dashboard",
                      "API access and integrations"
                    ].map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="mb-8 bg-gray-200" />
                  
                  <Button 
                    className={`w-full py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 ${
                      index === 1 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                        : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 shadow-md bg-white'
                    }`}
                    variant={index === 1 ? 'default' : 'outline'}
                    onClick={handleGetStarted}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {product.mode === 'subscription' ? 'Start Subscription' : 'Purchase Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-white relative">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-blue-100 leading-relaxed">
              Join thousands of satisfied customers who trust our platform for their business needs.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={handleGetStarted}
              className="text-lg px-12 py-4 bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              Start Your Journey Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-900 py-16 px-4 relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6 group">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                <Star className="h-7 w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-3xl font-bold text-gray-900">ProductApp</span>
            </div>
            <p className="text-gray-600 mb-6 text-lg max-w-2xl mx-auto">
              Building the future of digital experiences, one feature at a time.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <Globe className="h-6 w-6 text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer" />
              <Users className="h-6 w-6 text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer" />
              <Shield className="h-6 w-6 text-gray-500 hover:text-blue-600 transition-colors duration-300 cursor-pointer" />
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 ProductApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}