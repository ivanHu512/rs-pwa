import { redirect } from 'next/navigation'

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // 此时路由已经被 next-intl 中间件确认为合法语言
  // 但路径没有匹配到任何现有页面，被 [...catchAll] 捕获
  // 我们直接利用解析出的 locale 参数，将其重定向回该语言的首页
  redirect(`/${locale}`)
}
