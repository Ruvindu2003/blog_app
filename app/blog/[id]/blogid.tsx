// app/blog/[id]/page.tsx
export async function generateStaticParams() {
  // Fetch all post IDs from your database
  const posts = await fetchPosts(); // Replace with your data fetching

  return posts.map((post) => ({
    id: post.id,
  }));
}

// Your page component
export default function BlogPostPage({ params }: { params: { id: string } }) {
  // Page implementation
}