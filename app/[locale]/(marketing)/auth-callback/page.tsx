/**
 * 用于fb登陆回调页面，处理回调参数，并重定向到原页面
 */
import AuthCallbackClient from "@/components/auth-callback-client";

export default function AuthCallbackPage() {
  // 完全由客户端处理，因为需要读取 hash
  return <AuthCallbackClient />;
}
