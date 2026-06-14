"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
// import { payReport } from "@/utils/reportInfo/reportedMethods";
// import { getOrderInfo } from "@/lib";
import { useI18n } from "@/i18n";
import React, { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/dialog";
import StripeCheckoutForm from "@/components/stripe-checkout";
import { useDramaStore } from "@/stores/drama-store";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK || "");

export default function StripeModal() {
  const { stripeModal, setStripeModal } = useDramaStore();
  const { locale } = useI18n();
  const [isOpen, setOpen] = useState(false);

  const options = useMemo(() => {
    const { clientSecret } = stripeModal;
    return {
      clientSecret,
      locale: locale,
      appearance: {
        theme: "night",
        // labels: 'floating',
        // variables: {
        //   colorBackground: '#000',
        // }
      },
    };
  }, [stripeModal]);

  useEffect(() => {
    const { open, clientSecret } = stripeModal;

    if (open) {
      console.log("open modal");
      //   const orderInfo = getOrderInfo();
      if (!clientSecret) {
        return;
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [stripeModal]);

  const onClose = () => {
    setStripeModal({
      open: false,
      clientSecret: "",
    });
    // const orderInfo = getOrderInfo();
    // payReport({
    //   eventName: "pay_cancel",
    //   orderInfo,
    // });
    // removeSessionStorage("orderInfo");
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      className="max-h-screen overflow-y-auto overflow-x-hidden px-0"
    >
      <div className="mt-4">
        {options?.clientSecret && (
          <Elements stripe={stripePromise} options={options as any}>
            <StripeCheckoutForm />
          </Elements>
        )}
      </div>
    </Modal>
  );
}
