'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Calendar, Crown, Edit, Trash, Loader2, Plus, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete);

      if (error) throw error;
      
      setPosts(posts.filter(post => post.id !== postToDelete));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postToEdit) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('posts')
        .update({
          title: postToEdit.title,
          content: postToEdit.content,
          excerpt: postToEdit.excerpt,
          is_premium: postToEdit.is_premium,
          updated_at: new Date().toISOString()
        })
        .eq('id', postToEdit.id);

      if (error) throw error;
      
      setPosts(posts.map(post => post.id === postToEdit.id ? postToEdit : post));
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/90 border-blue-100">
              <CardHeader>
                <div className="h-6 bg-blue-100 rounded w-3/4"></div>
                <div className="h-4 bg-blue-100 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-blue-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-blue-100 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with search and create button */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-300"
          />
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Link href="/blog/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium text-blue-800 mb-2">No posts found</h3>
          <p className="text-blue-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create a post!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <Card 
              key={post.id} 
              className="bg-white/90 border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-xl text-blue-900">
                    <Link 
                      href={`/blog/${post.id}`} 
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.is_premium && (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                {post.excerpt && (
                  <CardDescription className="text-blue-700">
                    {post.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="flex justify-between items-center">
                <div className="flex items-center text-sm text-blue-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setPostToEdit(post);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setPostToDelete(post.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-blue-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-900">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-700">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-blue-300 text-blue-700 hover:bg-blue-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit post dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Edit Post</DialogTitle>
            <DialogDescription className="text-blue-700">
              Update your post details below
            </DialogDescription>
          </DialogHeader>
          
          {postToEdit && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-blue-800">Title</Label>
                <Input
                  id="title"
                  value={postToEdit.title}
                  onChange={(e) => setPostToEdit({...postToEdit, title: e.target.value})}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-blue-800">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={postToEdit.excerpt || ''}
                  onChange={(e) => setPostToEdit({...postToEdit, excerpt: e.target.value})}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content" className="text-blue-800">Content</Label>
                <Textarea
                  id="content"
                  value={postToEdit.content}
                  onChange={(e) => setPostToEdit({...postToEdit, content: e.target.value})}
                  className="min-h-[200px] border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={postToEdit.is_premium}
                  onCheckedChange={(checked) => setPostToEdit({...postToEdit, is_premium: checked})}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="premium" className="text-blue-800">Premium Content</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Post'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}