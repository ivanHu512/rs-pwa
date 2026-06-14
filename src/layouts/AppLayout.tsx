import { Outlet } from "react-router-dom";
import AuthProvider from '@/share/provider'
 
// import { useAppHeartReport } from "@/hooks/useAppHeartReport";
// import { useHighLowPayConfig } from "@/hooks/useHighLowPayConfig";
// import { useDramaLeaveRecommend } from "@/hooks/useDramaRecommend";
// import RecommendBookModal from "@/components/specific/RecommendBookModal";

export function AppLayout() {
  // useAppHeartReport();
  // useHighLowPayConfig();
  // useDramaLeaveRecommend();

  return (
    <>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
      {/* <RecommendBookModal /> */}
    </>
  );
}
