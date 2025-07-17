import PostEditor from '@/components/Blog/PostEditor';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <PostEditor postId={params.id} />
      </div>
    </div>
  );
}