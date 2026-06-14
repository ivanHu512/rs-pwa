import SubscriptionPage from '@/components/subscription'
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <SubscriptionPage />
}
