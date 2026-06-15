import { KeepAlive } from "react-activation";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
// import { RootLayout } from "./layouts/RootLayout";
import { DramaPage } from "./pages/DramaPage";
import { HomePage } from "./pages/HomePage";
// import { LanguageSelectPage } from "./pages/LanguageSelectPage";
// import { MyHistoryPage } from "./pages/MyHistoryPage";
// import { NotFoundPage } from "./pages/NotFoundPage";
// import { ProfilePage } from "./pages/ProfilePage";
// import AboutMePage from "./pages/AboutMePage";

KeepAlive.defaultProps = {
  ...KeepAlive.defaultProps,
  autoFreeze: false,
};

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <KeepAlive
            name="home-page"
            cacheKey="home-page"
            saveScrollPosition="screen"
          >
            <HomePage />
          </KeepAlive>
        ),
      },
      // {
      //   path: "/my-history",
      //   element: <MyHistoryPage />,
      // },
      // {
      //   path: "/profile",
      //   element: <ProfilePage />,
      // },
      // { path: "*", element: <NotFoundPage /> },
      // {
      //   path: "/",
      //   element: <RootLayout />,
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <KeepAlive
      //           name="home-page"
      //           cacheKey="home-page"
      //           saveScrollPosition="screen"
      //         >
      //           <HomePage />
      //         </KeepAlive>
      //       ),
      //     },
      //     {
      //       path: "/my-history",
      //       element: <MyHistoryPage />,
      //     },
      //     {
      //       path: "/profile",
      //       element: <ProfilePage />,
      //     },
      //     { path: "*", element: <NotFoundPage /> },
      //   ],
      // },
      {
        path: "/drama/:id",
        element: <DramaPage />,
      },
      // {
      //   path: "/language",
      //   element: <LanguageSelectPage />,
      // },
      // {
      //   path: "/about-me",
      //   element: <AboutMePage />,
      // },
    ],
  },
]);
