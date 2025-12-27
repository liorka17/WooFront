import { CanActivateFn, Router } from "@angular/router";                   // מייבא טיפוס Guard ו Router לניווט
import { inject } from "@angular/core";                                     // inject להזרקות בלי קונסטרקטור
import { AuthService } from "./auth.service";                               // שירות Auth כדי לקרוא משתמש מחובר

export const adminGuard: CanActivateFn = () => {                            // Guard שמאפשר רק admin
  const auth = inject(AuthService);                                         // הזרקת AuthService
  const router = inject(Router);                                            // הזרקת Router
  const user = auth.user();                                                 // שליפת משתמש נוכחי מהסיגנל

  if (!user) {                                                              // אם אין משתמש בכלל
    router.navigate(["/login"]);                                            // שולח ללוגין
    return false;                                                           // חוסם כניסה
  }                                                                         // סוף תנאי

  if (user.role !== "admin") {                                              // אם המשתמש לא admin
    router.navigate(["/app/dashboard"]);                                    // שולח לדשבורד רגיל
    return false;                                                           // חוסם כניסה
  }                                                                         // סוף תנאי

  return true;                                                              // אחרת מאשר כניסה
};                                                                          // סוף guard
