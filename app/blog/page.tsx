import PostList from '@/components/Blog/PostList';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Posts</h1>
          <p className="text-xl text-gray-600">
            Discover amazing content and premium articles
          </p>
        </div>
        <PostList />
      </div>
    </div>
  );
}