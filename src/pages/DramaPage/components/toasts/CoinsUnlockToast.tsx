import { useEffect, useState } from "react";
import CommonToast, {
  ICommonToastProps,
} from "@/components/common/CommonToast";
import { tStatic } from "@/i18n";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION = 2000;
const EXIT_OPACITY_ANIMATION_DURATION = 300;

const CoinsUnlockToastContent = ({ duration }: { duration?: number }) => {
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
        "flex w-full items-center rounded-[4px] bg-[#3D3D3D] p-[12px]",
        "transition-opacity",
        isAnimation ? "opacity-0" : "opacity-100",
      )}
      style={{ transitionDuration: `${EXIT_OPACITY_ANIMATION_DURATION}ms` }}
    >
      <i
        className="mr-[8px] block h-[20px] w-[20px] bg-contain bg-no-repeat"
        style={{
          backgroundImage: `url(https://v-mps.crazymaplestudios.com/images/57e350b0-b558-11f0-a06b-bdb674869ea1.png)`,
        }}
      ></i>
      <label className="text-[12px] font-[400]">
        {tStatic("video.lock-acc")}
      </label>
    </div>
  );
};

class CoinsUnlockToast {
  static show(options?: ICommonToastProps) {
    const duration = options?.duration ?? DEFAULT_DURATION;
    const content = <CoinsUnlockToastContent duration={duration} />;

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

export default CoinsUnlockToast;
