'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Crown, Upload, X, Image as ImageIcon } from 'lucide-react';

interface PostEditorProps {
  postId?: string;
}

interface User {
  id: string;
  email?: string;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (postId && user) {
      fetchPost();
    }
  }, [postId, user]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        setError('Authentication error. Please try logging in again.');
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      if (!user) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Error checking authentication status.');
    }
  };

  const fetchPost = async () => {
    if (!postId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('author_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Post not found or you do not have permission to edit it.');
        } else {
          throw error;
        }
        return;
      }
      
      setTitle(data.title || '');
      setContent(data.content || '');
      setExcerpt(data.excerpt || '');
      setIsPremium(data.is_premium || false);
      setFeaturedImage(data.featured_image || null);
      setImagePreview(data.featured_image || null);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      setError('Error fetching post: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setImageUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('blog')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError('Error uploading image: ' + (error?.message || 'Unknown error'));
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = async () => {
    if (featuredImage && featuredImage.includes('supabase')) {
      try {
        const path = featuredImage.split('/').pop();
        if (path) {
          await supabase.storage
            .from('blog')
            .remove([`${user?.id}/${path}`]);
        }
      } catch (error) {
        console.error('Error removing old image:', error);
      }
    }

    setImageFile(null);
    setImagePreview(null);
    setFeaturedImage(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!content.trim()) {
      setError('Content is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = featuredImage;

      // Only upload if there's a new image file
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      // If no image is selected and no existing image, set to null
      if (!imageFile && !featuredImage) {
        imageUrl = null;
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        is_premium: isPremium,
        author_id: user.id,
        featured_image: imageUrl,
        updated_at: new Date().toISOString(),
      };

      if (postId) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId)
          .eq('author_id', user.id);
        
        if (error) throw error;
        setSuccess('Post updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('posts')
          .insert([{
            ...postData,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();
        
        if (error) throw error;
        setSuccess(`Post created successfully!`);
        
        setTimeout(() => {
          router.push('/blog');
        }, 2000);
      }

      setImageFile(null);
    } catch (error: any) {
      console.error('Error saving post:', error);
      setError('Error saving post: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to create or edit posts.</p>
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {postId ? 'Edit Post' : 'Create New Post'}
          </CardTitle>
          <CardDescription>
            {postId ? 'Update your existing post' : 'Share your thoughts with the world'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of the post..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Featured image preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload a featured image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2"
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                className="h-64"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="premium"
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
              <Label htmlFor="premium" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Premium Content (requires subscription)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || imageUploading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {postId ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/blog')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}