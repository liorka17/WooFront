import { Injectable, computed, signal } from "@angular/core";                      // ייבוא Injectable וסיגנלים לניהול סטייט
import { HttpClient } from "@angular/common/http";                                 // ייבוא HttpClient לביצוע בקשות לשרת
import { Router } from "@angular/router";                                          // ייבוא Router לניווט אחרי התחברות או יציאה
import { tap } from "rxjs/operators";                                              // ייבוא tap לתופעות לוואי על תשובת השרת
import { Observable } from "rxjs";                                                 // ייבוא Observable לייצוג זרם אסינכרוני
import { environment } from "../../../environments/environment";                   // ייבוא הגדרות סביבה כדי לקבל apiBase

export interface AuthUser {                                                        // ממשק שמייצג משתמש מחובר
  id: number;                                                                      // מזהה משתמש
  email: string;                                                                   // אימייל משתמש
  role: "owner" | "agency" | "developer" | "admin";                                // תפקיד משתמש
}                                                                                  // סוף ממשק AuthUser

export interface LoginResponse {                                                   // ממשק לתשובת התחברות
  ok: boolean;                                                                     // האם הצליח
  status: number;                                                                  // קוד סטטוס
  token?: string;                                                                  // טוקן במקרה הצלחה
  user?: {                                                                         // אובייקט משתמש במקרה הצלחה
    id: number;                                                                    // מזהה משתמש
    email: string;                                                                 // אימייל
    role: "owner" | "agency" | "developer" | "admin";                              // תפקיד
  };                                                                               // סוף user
  error?: string;                                                                  // שגיאה במקרה כישלון
}                                                                                  // סוף ממשק LoginResponse

export interface RegisterRequest {                                               // ממשק לגוף בקשת רישום שנשלחת מהפרונט לשרת
  fullName: string;                                                              // שם מלא של המשתמש החדש
  email: string;                                                                 // כתובת האימייל של המשתמש החדש
  password: string;                                                              // סיסמה שהמשתמש בחר
  role: "owner" | "agency" | "developer";                                        // תפקיד המשתמש כפי שנבחר בטופס
  storeName: string;                                                             // שם החנות חובה כי הבקאנד דורש
  storeUrl: string;                                                              // כתובת חנות WooCommerce ראשית
  plan: "starter" | "pro";                                                       // תכנית המנוי ההתחלתית
  companyName?: string;                                                          // אופציונלי לעתיד אם תוסיף בבקאנד
  phone?: string;                                                                // אופציונלי לעתיד אם תוסיף בבקאנד
}                                                                                // סוף ממשק RegisterRequest

export interface RegisterResponse {                                              // ממשק לתגובה שמחזיר השרת לאחר רישום
  ok: boolean;                                                                   // האם הרישום הצליח
  user?: {                                                                       // אובייקט המשתמש שנוצר במערכת
    id: number;                                                                  // מזהה המשתמש במסד הנתונים
    fullName: string;                                                            // שם מלא כפי ששמור בשרת
    email: string;                                                               // אימייל כפי ששמור בשרת
    role: string;                                                                // תפקיד המשתמש כפי ששמור בשרת
    storeUrl: string;                                                            // כתובת החנות כפי ששמורה בשרת
    storeName: string;                                                           // שם החנות כפי ששמור בשרת
    plan: string;                                                                // תכנית המנוי כפי ששמורה בשרת
  };                                                                             // סוף אובייקט user
  error?: string;                                                                // הודעת שגיאה במקרה של כישלון הרישום
}                                                                                // סוף ממשק RegisterResponse
                                                                                 // סוף ממשק RegisterResponse

@Injectable({ providedIn: "root" })                                                 // רישום שירות גלובלי
export class AuthService {                                                         // מחלקת שירות Auth
  private apiBase = environment.apiBase;                                           // שמירת בסיס הכתובת מה environment

  private tokenSignal = signal<string | null>(null);                               // סיגנל לטוקן
  private userSignal = signal<AuthUser | null>(null);                              // סיגנל למשתמש

readonly user = computed<AuthUser | null>(() => this.userSignal());                // טיפוס מפורש כדי שלא יצא unknown
readonly isAuthenticated = computed<boolean>(() => !!this.tokenSignal());           // טיפוס מפורש לבוליאן


  constructor(private http: HttpClient, private router: Router) {                  // בנאי עם HttpClient ו Router
    const storedToken = localStorage.getItem("mcp_token");                         // קריאת טוקן מהדפדפן
    const storedUser = localStorage.getItem("mcp_user");                           // קריאת משתמש מהדפדפן

    if (storedToken) {                                                             // אם יש טוקן
      this.tokenSignal.set(storedToken);                                           // שמירת הטוקן בסיגנל
    }                                                                              // סוף תנאי טוקן

    if (storedUser) {                                                              // אם יש משתמש
      try {                                                                        // ניסיון המרה ל JSON
        this.userSignal.set(JSON.parse(storedUser));                               // שמירת המשתמש בסיגנל
      } catch {                                                                    // אם ההמרה נכשלה
        this.userSignal.set(null);                                                 // ניקוי משתמש פגום
      }                                                                            // סוף catch
    }                                                                              // סוף תנאי משתמש
  }                                                                                // סוף בנאי

  login(email: string, password: string): Observable<LoginResponse> {              // פונקציית התחברות
    return this.http                                                               // התחלת בקשת HTTP
      .post<LoginResponse>(                                                        // POST עם טיפוס תשובה
        `${this.apiBase}/auth/login`,                                              // נתיב יחסי דרך apiBase
        { email, password }                                                        // גוף הבקשה
      )                                                                            // סוף post
      .pipe(                                                                       // הפעלת pipe
        tap((res) => {                                                             // tap על התשובה
          if (res.ok && res.token && res.user) {                                   // אם הצליח ויש נתונים
            this.setAuthState(res.token, {                                         // שמירת מצב התחברות
              id: res.user.id,                                                     // מזהה
              email: res.user.email,                                               // אימייל
              role: res.user.role,                                                 // תפקיד
            });                                                                    // סוף setAuthState
          }                                                                        // סוף תנאי הצלחה
        })                                                                         // סוף tap
      );                                                                           // סוף pipe
  }                                                                                // סוף login

  register(payload: RegisterRequest): Observable<RegisterResponse> {               // פונקציית הרשמה
    return this.http                                                               // התחלת בקשת HTTP
      .post<RegisterResponse>(                                                     // POST עם טיפוס תשובה
        `${this.apiBase}/auth/register`,                                           // נתיב יחסי דרך apiBase
        payload                                                                    // גוף הבקשה
      );                                                                           // סוף post
  }                                                                                // סוף register

  logout(): void {                                                                 // פונקציית יציאה
    this.tokenSignal.set(null);                                                    // ניקוי טוקן
    this.userSignal.set(null);                                                     // ניקוי משתמש
    localStorage.removeItem("mcp_token");                                          // מחיקת טוקן מהדפדפן
    localStorage.removeItem("mcp_user");                                           // מחיקת משתמש מהדפדפן
    this.router.navigate(["/login"]);                                              // ניווט למסך התחברות
  }                                                                                // סוף logout

  private setAuthState(token: string, user: AuthUser): void {                      // פונקציה פנימית לשמירת מצב
    this.tokenSignal.set(token);                                                   // שמירת טוקן בסיגנל
    this.userSignal.set(user);                                                     // שמירת משתמש בסיגנל
    localStorage.setItem("mcp_token", token);                                      // שמירת טוקן בדפדפן
    localStorage.setItem("mcp_user", JSON.stringify(user));                        // שמירת משתמש בדפדפן
  }                                                                                // סוף setAuthState

  getToken(): string | null {                                                      // פונקציה שמחזירה טוקן
    return this.tokenSignal();                                                     // החזרת ערך הטוקן
  }    
  me(): Observable<{ ok: boolean; user?: AuthUser; error?: string }> {               // פונקציה שמביאה משתמש מהשרת לפי הטוקן
  return this.http                                                                 // שימוש ב HttpClient
    .get<{ ok: boolean; user?: AuthUser; error?: string }>(                        // קריאת GET עם טיפוס תשובה
      `${this.apiBase}/auth/me`                                                    // נתיב me
    )                                                                              // סוף get
    .pipe(                                                                         // הפעלת pipe
      tap((res) => {                                                               // tap לעדכון סטייט
        if (res.ok && res.user) {                                                  // אם הצליח ויש user
          this.userSignal.set(res.user);                                           // עדכון הסיגנל של המשתמש
          localStorage.setItem("mcp_user", JSON.stringify(res.user));              // עדכון המשתמש בדפדפן
        }                                                                          // סוף תנאי
      })                                                                           // סוף tap
    );                                                                             // סוף pipe
}                                                                                  // סוף me

             
                                                                               // סוף פונקציה
                     
                                            // סוף getToken
}                                                                                  // סוף AuthService


