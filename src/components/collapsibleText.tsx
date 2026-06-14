import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface CollapsibleTextProps {
  content: string;
  maxLines?: number;
  className?: string;
  moreButton?: ReactNode;
  isHtml?: boolean;
  moreText?: string;
  moreClass?: string;
  mbMaxLines?: number;
  onMoreClick?: () => void;
}

export const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  content,
  maxLines = 3,
  mbMaxLines = undefined,
  className = "",
  moreButton,
  isHtml = false,
  moreText = "",

  onMoreClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [currentLines, setCurrentLines] = useState(maxLines);
  const contentRef = useRef<HTMLDivElement>(null);

  const calculateHeight = useCallback(() => {
    const element = contentRef.current;
    if (element) {
      // h5 和 pc 可以分别设置行数，目前就按md来区分
      const isMobile = window.innerWidth < 768;
      const lines = isMobile ? (mbMaxLines ? mbMaxLines : maxLines) : maxLines;

      // 更新当前应用的行数
      setCurrentLines(lines);

      const height = element.scrollHeight;
      const clientHeight = element.clientHeight;

      // 使用相对误差，比如内容高度超过可见区域高度的2%才显示展开按钮
      const threshold = Math.max(2, clientHeight * 0.02); // 至少2像素或者2%的高度
      setHasMore(height > clientHeight + threshold);
    }
  }, [maxLines, mbMaxLines]);

  useEffect(() => {
    // 等待下一帧，确保DOM已完全渲染
    const timeoutId = setTimeout(() => {
      calculateHeight();
    }, 50);
    const handleResize = () => {
      calculateHeight();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [content, calculateHeight]);

  const contentProps = isHtml
    ? { dangerouslySetInnerHTML: { __html: content } }
    : { children: content };

  return (
    <div className="relative">
      <div
        ref={contentRef}
        style={{
          display: isExpanded ? "block" : "-webkit-box",
          WebkitLineClamp: isExpanded ? "unset" : currentLines,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden",
          textOverflow: isExpanded ? "unset" : "ellipsis",
        }}
        className={`text-[14px] leading-[normal] ${className} ${
          !isExpanded ? "overflow-hidden" : ""
        }`}
        {...contentProps}
      />
      {hasMore && !isExpanded && (
        <div
          onClick={() => {
            setIsExpanded(true);
            onMoreClick && onMoreClick();
          }}
          className="absolute bottom-0 right-[-1px] flex cursor-pointer items-center text-[14px] leading-[normal]"
        >
          <div className="to-bg-background bg-gradient-to-r from-background/10 via-background/50 via-[30%] pl-[40px]">
            <div className="flex items-center bg-background">
              <span className="px-1 text-white/50">...</span>
              {moreButton || (
                <span className="flex cursor-pointer items-center">
                  {moreText}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
