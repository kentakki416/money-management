import { NextRequest, NextResponse } from "next/server"

const AUTH_TOKEN_COOKIE = "auth_token"

/**
 * 認証が不要な公開パス
 */
const PUBLIC_PATHS = ["/signin", "/api/auth/"]

/**
 * 認証ミドルウェア
 * Cookie にトークンがない場合、サインインページにリダイレクトする
 */
export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /**
     * 静的ファイルと Next.js 内部パスを除外
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
