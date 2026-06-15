import { useEffect, useState } from "react";
import CommonToast, {
  ICommonToastProps,
} from "@/components/common/CommonToast";
import { tStatic } from "@/i18n";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION = 2000;
const EXIT_OPACITY_ANIMATION_DURATION = 300;

const VipUnlockToastContent = ({ duration }: { duration?: number }) => {
  const [isAnimation, setIsAnimation] = useState(false);

  useEffect(() => {
    if (!duration) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setIsAnimation(true);
      },
      Math.max(duration - EXIT_OPACITY_ANIMATION_DURATION, 0),
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [duration]);

  return (
    <div
      className={cn(
        "flex h-[48px] w-full items-center rounded-[4px] border-[0.5px] border-transparent px-[12px]",
        "transition-opacity",
        isAnimation ? "opacity-0" : "opacity-100",
      )}
      style={{
        transitionDuration: `${EXIT_OPACITY_ANIMATION_DURATION}ms`,
        background:
          "linear-gradient(to right, #FFF0DC, #F2CA91) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box",
      }}
    >
      <i
        className="mr-[8px] block h-[20px] w-[20px] bg-contain bg-no-repeat"
        style={{
          backgroundImage: `url(https://v-mps.crazymaplestudios.com/images/fe2e3620-c4ed-11f0-84ad-6b5693b490dc.png)`,
        }}
      ></i>
      <label className="text-[12px] font-[400] text-[#401A06]">
        {tStatic("video.acc")}
      </label>
    </div>
  );
};

class VipUnlockToast {
  static show(options?: ICommonToastProps) {
    const duration = options?.duration ?? DEFAULT_DURATION;
    const content = <VipUnlockToastContent duration={duration} />;

    CommonToast.show(content, {
      ...options,
      wrapperClassName: cn(options?.wrapperClassName, "relative inset-auto"),
      contentClassName: cn(
        options?.contentClassName,
        "bg-[none] absolute bottom-[100px] w-full py-0 px-[16px] text-white/90 max-w-[100vw]",
      ),
    });
  }
}

export default VipUnlockToast;
