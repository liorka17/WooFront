import { HttpInterceptorFn } from "@angular/common/http";                         // מייבא Interceptor פונקציונלי
import { inject } from "@angular/core";                                           // inject לשירותים
import { AuthService } from "./auth.service";                                     // שירות auth
import { environment } from "../../../environments/environment";                  // environment

export const authInterceptor: HttpInterceptorFn = (req, next) => {                // interceptor
  const auth = inject(AuthService);                                               // AuthService
  const token = auth.getToken();                                                  // token מה storage

  if (!token) return next(req);                                                   // אם אין token לא נוגעים

  if (req.headers.has("Authorization")) return next(req);                         // אם כבר יש Authorization לא דורסים

  const apiBase = environment.apiBase;                                            // לדוגמה "/api" או "http://localhost:3000/api"

  const isRelativeApi = req.url.startsWith("/api/");                              // קריאות דרך proxy: /api/...
  const isEnvApiBase = apiBase && req.url.startsWith(apiBase);                    // אם מישהו משתמש ב apiBase מלא
  const isApiUrl = isRelativeApi || isEnvApiBase || req.url.includes("/api/");    // כיסוי גם לכתובות מלאות

  if (!isApiUrl) return next(req);                                                // אם לא API לא מוסיפים header

  const authReq = req.clone({                                                     // clone
    setHeaders: { Authorization: `Bearer ${token}` },                              // הוספת Bearer
  });                                                                              // סוף clone

  // אם אתה רוצה לוגים רק בפיתוח:
  // if (!environment.production) console.log("Token added:", req.url);

  return next(authReq);                                                           // ממשיך
};                                                                                // סוף interceptor
