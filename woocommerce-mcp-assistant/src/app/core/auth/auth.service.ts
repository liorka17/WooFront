import { Injectable, computed, signal } from "@angular/core";                    // ייבוא דקורטור Injectable וסיגנלים לניהול סטייט של התחברות
import { HttpClient } from "@angular/common/http";                               // ייבוא HttpClient לביצוע קריאות HTTP לשרת
import { Router } from "@angular/router";                                        // ייבוא Router לניווט בין מסכים אחרי התחברות או יציאה
import { tap } from "rxjs/operators";                                            // ייבוא האופרטור tap לצורך תופעות לוואי על ה Observable
import { Observable } from "rxjs";                                               // ייבוא טיפוס Observable שמייצג זרם אסינכרוני

export interface AuthUser {                                                      // ממשק שמייצג משתמש מחובר בצד לקוח
  id: number;                                                                    // מזהה משתמש ייחודי
  email: string;                                                                 // כתובת אימייל של המשתמש
  role: "owner" | "agency" | "developer" | "admin";                              // תפקיד המשתמש במערכת
}

export interface LoginResponse {                                                 // ממשק לתשובת התחברות מהשרת
  ok: boolean;                                                                   // האם הבקשה הצליחה או נכשלה
  status: number;                                                                // קוד סטטוס HTTP שהשרת החזיר
  token?: string;                                                                // טוקן JWT שהשרת מחזיר במקרה של הצלחה
  user?: {                                                                       // אובייקט משתמש שמתקבל מהשרת במקרה של הצלחה
    id: number;                                                                  // מזהה המשתמש
    email: string;                                                               // אימייל המשתמש
    role: "owner" | "agency" | "developer" | "admin";                            // תפקיד המשתמש
  };                                                                             // סיום הגדרת אובייקט user
  error?: string;                                                                // הודעת שגיאה טקסטואלית במקרה של כישלון
}

export interface RegisterRequest {                                               // ממשק לגוף בקשת רישום שנשלחת מהפרונט לשרת
  fullName: string;                                                              // שם מלא של המשתמש החדש
  email: string;                                                                 // כתובת האימייל של המשתמש החדש
  password: string;                                                              // סיסמה שהמשתמש בחר
  role: "owner" | "agency" | "developer";                                        // תפקיד המשתמש כפי שנבחר בטופס
  storeUrl: string;                                                              // כתובת חנות WooCommerce ראשית
  plan: "starter" | "pro";                                                       // תכנית המנוי ההתחלתית
}

export interface RegisterResponse {                                              // ממשק לתגובה שמחזיר השרת לאחר רישום
  ok: boolean;                                                                   // האם הרישום הצליח
  user?: {                                                                       // אובייקט המשתמש שנוצר במערכת
    id: number;                                                                  // מזהה המשתמש במסד הנתונים
    fullName: string;                                                            // שם מלא כפי ששמור בשרת
    email: string;                                                               // אימייל כפי ששמור בשרת
    role: string;                                                                // תפקיד המשתמש כפי ששמור בשרת
    storeUrl: string;                                                            // כתובת החנות כפי ששמורה בשרת
    plan: string;                                                                // תכנית המנוי כפי ששמורה בשרת
  };                                                                             // סיום אובייקט user
  error?: string;                                                                // הודעת שגיאה במקרה של כישלון הרישום
}

@Injectable({                                                                    // דקורטור שמגדיר את השירות כ Injectable
  providedIn: "root",                                                            // הופך את השירות לגלובלי לכל האפליקציה
})
export class AuthService {                                                       // מחלקת השירות שאחראית על התחברות ורישום
  private baseUrl = "http://localhost:3000";                                     // בסיס כתובת של שרת הבקאנד

  private tokenSignal = signal<string | null>(null);                             // סיגנל שמחזיק את הטוקן הנוכחי בזיכרון
  private userSignal = signal<AuthUser | null>(null);                            // סיגנל שמחזיק את פרטי המשתמש המחובר

  readonly user = computed(() => this.userSignal());                             // מאפיין לקריאה בלבד שמחזיר את המשתמש המחובר
  readonly isAuthenticated = computed(() => !!this.tokenSignal());               // מאפיין לקריאה בלבד שבודק האם יש טוקן שמור

  constructor(private http: HttpClient, private router: Router) {                // בנאי שמזריק HttpClient ו Router לשירות
    const storedToken = localStorage.getItem("mcp_token");                       // ניסיון לטעון טוקן שנשמר בלוקאל סטורג'
    const storedUser = localStorage.getItem("mcp_user");                         // ניסיון לטעון פרטי משתמש שנשמרו בלוקאל סטורג'

    if (storedToken) {                                                           // אם נמצא טוקן שמור
      this.tokenSignal.set(storedToken);                                         // מעדכן את סיגנל הטוקן מהערך השמור
    }

    if (storedUser) {                                                            // אם נמצאו פרטי משתמש שמורים
      try {                                                                      // ניסיון לפרסר את המחרוזת השמורה כ JSON
        this.userSignal.set(JSON.parse(storedUser));                             // שומר את אובייקט המשתמש בסיגנל
      } catch {                                                                  // במקרה של שגיאת פרסור
        this.userSignal.set(null);                                               // מנקה את סיגנל המשתמש כדי לא לעבוד עם נתון פגום
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {            // פונקציה שמבצעת התחברות לשרת
    return this.http                                                             // החזרת ה Observable שנוצר מקריאת HTTP
      .post<LoginResponse>(                                                      // ביצוע בקשת POST לשרת עם טיפוס תגובה LoginResponse
        `${this.baseUrl}/api/auth/login`,                                        // כתובת הנתיב של התחברות בבקאנד
        { email, password }                                                      // גוף הבקשה שמכיל אימייל וסיסמה
      )                                                                          // סיום קריאת POST
      .pipe(                                                                     // הפעלת צינור אופרטורים על ה Observable
        tap((res) => {                                                           // אופרטור tap שמבצע לוגיקה צדדית על התשובה
          if (res.ok && res.token && res.user) {                                 // בדיקה שהתשובה הצליחה ויש גם token וגם user
            this.setAuthState(res.token, {                                       // שמירת מצב ההתחברות עם הטוקן והמשתמש
              id: res.user.id,                                                   // שמירת מזהה המשתמש
              email: res.user.email,                                             // שמירת כתובת האימייל
              role: res.user.role,                                               // שמירת תפקיד המשתמש
            });                                                                  // סיום קריאת setAuthState
          }                                                                      // סיום תנאי בדיקת הצלחה
        })                                                                       // סיום אופרטור tap
      );                                                                         // סיום pipe והחזרת ה Observable המעובד
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {             // פונקציה שמבצעת רישום משתמש חדש בבקאנד
    return this.http                                                             // החזרת ה Observable שנוצר מקריאת HTTP
      .post<RegisterResponse>(                                                   // ביצוע בקשת POST עם טיפוס תגובה RegisterResponse
        `${this.baseUrl}/api/auth/register`,                                     // כתובת הנתיב של רישום בבקאנד
        payload                                                                  // גוף הבקשה הכולל פרטי המשתמש החדש
      );                                                                         // סיום קריאת POST
  }

  logout(): void {                                                               // פונקציה שמבצעת יציאה של המשתמש מהמערכת
    this.tokenSignal.set(null);                                                  // ניקוי הטוקן מהסיגנל בזיכרון
    this.userSignal.set(null);                                                   // ניקוי פרטי המשתמש מהסיגנל בזיכרון
    localStorage.removeItem("mcp_token");                                        // מחיקת הטוקן מה Local Storage של הדפדפן
    localStorage.removeItem("mcp_user");                                         // מחיקת פרטי המשתמש מה Local Storage של הדפדפן
    this.router.navigate(["/login"]);                                            // ניווט למסך התחברות לאחר יציאה
  }

  private setAuthState(token: string, user: AuthUser): void {                    // פונקציה פנימית שמעדכנת את מצב ההתחברות
    this.tokenSignal.set(token);                                                 // שמירת הטוקן בסיגנל בזיכרון
    this.userSignal.set(user);                                                   // שמירת פרטי המשתמש בסיגנל בזיכרון
    localStorage.setItem("mcp_token", token);                                    // שמירת הטוקן גם ב Local Storage לצורך שימור התחברות
    localStorage.setItem("mcp_user", JSON.stringify(user));                      // שמירת פרטי המשתמש כמחרוזת JSON ב Local Storage
  }

  getToken(): string | null {                                                    // פונקציה שמחזירה את הטוקן הנוכחי אם קיים
    return this.tokenSignal();                                                   // קריאת ערך הסיגנל שמחזיק את הטוקן
  }
}
