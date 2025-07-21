export default function middleware(req) {
  const res = NextResponse.next()
  
  // Set CORS headers
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return res
}