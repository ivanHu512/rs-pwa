import { getApps, initializeApp, FirebaseApp } from 'firebase/app'
import { getSiteConfigClient } from '@/lib/config/site'

// Your web app's Firebase configuration
let firebaseApp: FirebaseApp

if (typeof window !== 'undefined') {
  const config = getSiteConfigClient()?.firebase
  if (config) {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0]
  }
}

export default firebaseApp!
// 懒加载初始化函数
// let firebaseAppInstance: ReturnType<typeof initializeApp> | null = null;

// function getFirebaseApp() {
//   if (!firebaseAppInstance) {
//     firebaseAppInstance =
//       getApps().length === 0 ? initializeApp(configs) : getApps()[0];
//   }
//   return firebaseAppInstance;
// }

// export default getFirebaseApp;
