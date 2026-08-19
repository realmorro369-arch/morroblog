export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** 打开站内认证页面；不再跳转至第三方登录。 */
export const startLogin = () => {
  if (typeof window !== "undefined") window.location.assign("/login");
};
