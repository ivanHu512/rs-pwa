import React, { CSSProperties, memo } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  className?: string;
  textClassName?: string;
  style?: CSSProperties;
}

const VideoLoading: React.FC<ProgressBarProps> = ({
  className,
  textClassName,
  style,
}) => {
  return (
    <div className={cn("w-full h-[30px] relative", className)} style={style}>
      <div
        className={cn(
          "absolute z-[1] top-[-1] flex items-end justify-center w-full h-full",
          textClassName,
        )}
      >
        <div className={cn("w-full h-[2px] px-[10.5px]")}>
          <div
            className={cn(
              "w-full h-full flex items-center justify-center animation",
            )}
          >
            <div className="w-full h-full bg-[linear-gradient(to_right,transparent_0%,white_35%,white_65%,transparent_100%)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default memo(VideoLoading);
