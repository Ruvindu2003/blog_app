import PostDetail from '@/components/Blog/PostDetail';

interface PostPageProps {
  params: {
    id: string;
  };
}

export default function PostPage({ params }: PostPageProps) {
  return <PostDetail postId={params.id} />;
}