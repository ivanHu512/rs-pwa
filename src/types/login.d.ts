declare namespace LoginModuleType {
  interface FbCallbackType {
    email: string;
    sid: number;
    openid: string;
    uname: string;
    pic: string;
  }
}

export = LoginModuleType;
export as namespace LoginModuleType;
