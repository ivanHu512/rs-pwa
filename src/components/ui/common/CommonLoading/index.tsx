import iconLoading from "@/assets/icon_loading.png";
import { cn } from "@/lib/utils";
import ReactDOM from "react-dom/client";

let concurrentLoadingCount = 0;

const COMMON_LOADING_CLASS_NAME = "common-loading";

const DELAY_HIDE_TIME = 15000;

const LoadingContent = () => {
  return (
    <div
      className={cn(
        "fixed bg-black bg-opacity-50 inset-0 flex justify-center items-center flex-col z-[var(--loading-toast-z-index)]",
        "transition-opacity duration-300",
      )}
    >
      <div
        className={cn(
          "p-[32px] rounded-[8px] bg-[#1f1f1fe5] flex items-center",
        )}
      >
        <img src={iconLoading} alt="Loading" className="w-[40px] h-[40px]" />
      </div>
    </div>
  );
};

const removeAllLoading = () => {
  const elements = document.getElementsByClassName(COMMON_LOADING_CLASS_NAME);
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element) {
      if (element.parentElement) {
        document.body.removeChild(element);
      }
    }
  }
};

let timeId: number | undefined = undefined;
const setTimeoutClose = () => {
  if (timeId) {
    clearTimeout(timeId);
  }
  timeId = window.setTimeout(() => {
    concurrentLoadingCount = 0;
    removeAllLoading();
  }, DELAY_HIDE_TIME);
};

interface IOptions {
  /**
   * 是否需要默认关闭所有loading, 默认开启，开启后会定时DELAY_HIDE_TIME兜底关闭所有loading，
   */
  needDefaultCloseAll?: boolean;
}

class CommonLoading {
  static close: () => void = () => {};
  static show(options?: IOptions) {
    const { needDefaultCloseAll = true } = options || {};
    if (concurrentLoadingCount > 0) {
      concurrentLoadingCount++;
      return;
    } else {
      concurrentLoadingCount++;
    }
    const container = document.createElement("div");
    container.classList.add(COMMON_LOADING_CLASS_NAME);
    document.body.appendChild(container);
    this.close = () => {
      try {
        if (concurrentLoadingCount > 0) {
          concurrentLoadingCount--;
        }
        if (concurrentLoadingCount <= 0) {
          removeAllLoading();
        }
        if (needDefaultCloseAll) {
          setTimeoutClose();
        }
      } catch (error) {
        console.log("error", error);
      }
    };

    ReactDOM.createRoot(container).render(<LoadingContent />);
  }
}

export default CommonLoading;
