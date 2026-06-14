"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import StripeCheckoutForm from "@/components/stripe-checkout";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK || "");

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("clientSecret");
  const locale = useLocale();

  if (!clientSecret) {
    return null;
  }

  const options: StripeElementsOptions = {
    clientSecret: clientSecret,
    locale: locale as any,
    
    appearance: {
      
      theme: "night",
      variables: {
        colorPrimary: "#fff",
        colorBackground: "#292929",
        colorDanger: "#E52E2E",
        fontSizeBase: "14px",
      },
      rules: {
        ".Input": {
          backgroundColor: "#3D3D3D",
          boxShadow: "none",
          // border: '1px solid var(--colorPrimary)'
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm />
    </Elements>
  );
}
