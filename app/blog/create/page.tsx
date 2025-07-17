import PostEditor from '@/components/Blog/PostEditor';

export default function CreatePostPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <PostEditor />
      </div>
    </div>
  );
}