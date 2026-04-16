import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const AUTH_TOKEN_COOKIE = "auth_token"
const AUTH_USER_COOKIE = "auth_user"

/**
 * Google OAuth コールバック処理
 *
 * API サーバーからトークンとユーザー情報をクエリパラメータで受け取り、
 * httpOnly Cookie にセットした後、ホーム画面にリダイレクトする。
 */
export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token")
  const userParam = request.nextUrl.searchParams.get("user")
  const error = request.nextUrl.searchParams.get("error")

  if (error || !token || !userParam) {
    return NextResponse.redirect(
      new URL(`/signin${error ? `?error=${error}` : ""}`, request.url)
    )
  }

  const cookieStore = await cookies()

  /**
   * 認証トークンを httpOnly Cookie に保存
   */
  cookieStore.set(AUTH_TOKEN_COOKIE, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  /**
   * ユーザー情報を Cookie に保存（クライアントから読み取るため httpOnly: false）
   */
  cookieStore.set(AUTH_USER_COOKIE, userParam, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return NextResponse.redirect(new URL("/", request.url))
}
