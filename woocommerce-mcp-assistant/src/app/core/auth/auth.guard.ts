import { CanActivateFn, Router } from "@angular/router";                           // מייבא טיפוס Guard ורכיב Router
import { inject } from "@angular/core";                                            // inject להזרקת שירותים פונקציונלית
import { AuthService } from "./auth.service";                                      // מייבא את שירות האימות
import { map, catchError, of } from "rxjs";                                        // אופרטורים לעיבוד תשובה וטיפול בשגיאות

export const authGuard: CanActivateFn = (route, state) => {                        // Guard שמופעל לפני כניסה לראוט
  const auth = inject(AuthService);                                                // הזרקת שירות AuthService
  const router = inject(Router);                                                   // הזרקת Router לניווט

  const token = auth.getToken();                                                   // שליפת הטוקן מהזיכרון
  if (!token) {                                                                    // אם אין טוקן בכלל
    return router.createUrlTree(["/login"], {                                      // מחזיר הפניה ללוגין
      queryParams: { returnUrl: state.url },                                       // שומר לאן המשתמש רצה להגיע
    });                                                                            // סוף יצירת UrlTree
  }                                                                                // סוף תנאי אין טוקן

  return auth.me().pipe(                                                           // קורא לשרת כדי לוודא שהטוקן תקף
    map((res) => {                                                                 // ממפה את תשובת השרת
      if (res.ok) return true;                                                     // אם השרת אישר טוקן תקין מאפשר כניסה
      return router.createUrlTree(["/login"], {                                    // אחרת מפנה ללוגין
        queryParams: { returnUrl: state.url },                                     // שומר לאן המשתמש רצה להגיע
      });                                                                          // סוף יצירת UrlTree
    }),                                                                            // סוף map
    catchError(() =>                                                               // אם יש שגיאה או 401
      of(                                                                          // מחזירים Observable עם הפניה ללוגין
        router.createUrlTree(["/login"], {                                         // הפניה ללוגין
          queryParams: { returnUrl: state.url },                                   // שומר לאן המשתמש רצה להגיע
        })                                                                         // סוף UrlTree
      )                                                                            // סוף of
    )                                                                              // סוף catchError
  );                                                                               // סוף pipe
};                                                                                 // סוף guard
