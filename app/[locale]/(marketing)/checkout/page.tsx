import { getTranslations } from "next-intl/server";

import Adyen from "@/components/adyen";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="mx-auto p-4 md:max-w-xl">
      <h1 className="text-base font-bold">{t("checkout.pay-method")}</h1>
      <div className="mt-4 pb-[100px]">
        <Adyen />
      </div>
    </div>
  );
}
