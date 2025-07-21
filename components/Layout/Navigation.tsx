'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Star, User, PlusCircle, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">BlogApp</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              asChild 
              className="hover:bg-primary/10 transition-colors duration-300"
            >
              <Link href="/blog">Blog</Link>
            </Button>
            
            {loading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  asChild 
                  className="hover:bg-primary/10 transition-colors duration-300"
                >
                  <Link href="/blog/create">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/20 hover:border-primary/40 transition-colors duration-300"
                    >
                      <User className="h-4 w-4 mr-2 text-primary" />
                      <span className="max-w-[150px] truncate">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-primary" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center">
                      {theme === 'dark' ? (
                        <Sun className="h-4 w-4 mr-2 text-primary" />
                      ) : (
                        <Moon className="h-4 w-4 mr-2 text-primary" />
                      )}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  asChild 
                  className="hover:bg-primary/10 transition-colors duration-300"
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary/90 text-white transition-colors duration-300"
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}