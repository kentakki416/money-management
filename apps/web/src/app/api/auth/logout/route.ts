import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const AUTH_TOKEN_COOKIE = "auth_token"
const AUTH_USER_COOKIE = "auth_user"

/**
 * ログアウト処理
 * 認証関連の Cookie を削除し、サインインページにリダイレクトする
 */
export const POST = async (request: NextRequest) => {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_TOKEN_COOKIE)
  cookieStore.delete(AUTH_USER_COOKIE)

  return NextResponse.redirect(new URL("/signin", request.url))
}
