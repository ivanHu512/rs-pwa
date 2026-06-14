import React from "react";
import { createPortal } from "react-dom";

interface IProps {
  container?: Element | null;
  children?: React.ReactNode;
}

const PortalContainer: React.FC<IProps> = ({ container, children }) => {
  if (container) {
    // 渲染到指定 DOM
    return createPortal(children, container);
  }

  // 默认渲染在原位置
  return <>{children}</>;
};

export default PortalContainer;
