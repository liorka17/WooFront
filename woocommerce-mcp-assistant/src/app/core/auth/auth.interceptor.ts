import { HttpInterceptorFn } from "@angular/common/http";                         // מייבא Interceptor פונקציונלי
import { inject } from "@angular/core";                                           // inject לשירותים
import { AuthService } from "./auth.service";                                     // שירות auth
import { environment } from "../../../environments/environment";                  // environment כדי לדעת מה apiBase

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  console.log('🔍 Interceptor check:', {
    url: req.url,
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
  });

  if (!token) return next(req);

  const apiBase = environment.apiBase;
  const isProxyApi = req.url.startsWith(apiBase);
  const isDirectApi = req.url.includes("127.0.0.1:3000/api");
  const isApiRequest = isProxyApi || isDirectApi;

  console.log('📍 URL check:', {
    apiBase,
    isProxyApi,
    isDirectApi,
    isApiRequest
  });

  if (!isApiRequest) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  console.log('✅ Token added to request');
  return next(authReq);
};                                                                            // סוף interceptor
