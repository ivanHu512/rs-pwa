"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn, formatTime } from "@/lib/utils";

type CountdownProps = {
  /** 目标时间戳（毫秒）。与 seconds 互斥，若同时传入优先使用 seconds */
  leaveTime?: number;
  id: string;

  /** 自定义样式 */
  className?: string;
  /** 倒计时结束回调（只触发一次） */
  onEnd?: () => void;
};

/** 保存当前时间 */

const storeTimes = new Map();

export default function Countdown({
  leaveTime = 0,
  className,
  id,
  onEnd,
}: CountdownProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const endedRef = useRef(false);

  const countdownId = `count_down_${id}`;

  useEffect(() => {
    const time = storeTimes.get(countdownId);

    if (!time) {
      storeTimes.set(countdownId, leaveTime);
      setRemaining(leaveTime);
    } else {
      setRemaining(time);
    }

    endedRef.current = false;
  }, []);

  // 每秒减1，到0停止，并只触发一次 onEnd
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && !endedRef.current) {
          endedRef.current = true;
          onEnd?.();
        }
        storeTimes.set(countdownId, next);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onEnd]);

  const content = useMemo(() => {
    return formatTime(remaining, true);
  }, [remaining]);

  return <span className={cn(className)}>{content}</span>;
}
