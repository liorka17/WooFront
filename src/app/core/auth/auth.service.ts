import { Injectable, computed, signal } from "@angular/core";                    // שירות אינג'קטבילי שמנהל סטייט של התחברות
import { HttpClient } from "@angular/common/http";                               // לקוח HTTP לקריאות לשרת
import { Router } from "@angular/router";                                        // ראוטר לניווט אחרי התחברות או יציאה
import { tap } from "rxjs/operators";                                            // אופרטור tap לתופעות לוואי
import { Observable } from "rxjs";                                               // טיפוס Observable

export interface AuthUser {                                                      // ייצוג המשתמש בצד לקוח
  id: number;
  email: string;
  role: "owner" | "agency" | "developer" | "admin";
}

export interface LoginResponse {                                                 // תגובת התחברות מהשרת
  ok: boolean;                                                                   // האם הפעולה הצליחה
  status: number;                                                                // קוד סטטוס HTTP שהשרת החזיר
  token?: string;                                                                // טוקן JWT במקרה של הצלחה
  user?: {                                                                       // פרטי המשתמש במקרה של הצלחה
    id: number;
    email: string;
    role: "owner" | "agency" | "developer" | "admin";
  };
  error?: string;                                                                // הודעת שגיאה במקרה של כישלון
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private baseUrl = "http://localhost:3000";                                     // בסיס כתובת של הבקאנד

  private tokenSignal = signal<string | null>(null);                             // סטייט של הטוקן
  private userSignal = signal<AuthUser | null>(null);                            // סטייט של המשתמש המחובר

  readonly user = computed(() => this.userSignal());                             // מחשב משתמש נוכחי לקריאה בלבד
  readonly isAuthenticated = computed(() => !!this.tokenSignal());               // בודק האם יש טוקן שמור

  constructor(private http: HttpClient, private router: Router) {
    const storedToken = localStorage.getItem("mcp_token");                       // ניסיון לטעון טוקן מלוקאל סטורג'
    const storedUser = localStorage.getItem("mcp_user");                         // ניסיון לטעון משתמש מלוקאל סטורג'

    if (storedToken) {                                                           // אם קיים טוקן שמור
      this.tokenSignal.set(storedToken);                                         // מעדכן את הסטייט מהטוקן השמור
    }

    if (storedUser) {                                                            // אם קיים משתמש שמור
      try {
        this.userSignal.set(JSON.parse(storedUser));                             // מנסה לפרסר ולשמור את המשתמש
      } catch {
        this.userSignal.set(null);                                               // במקרה של שגיאה מנקה את המשתמש
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {            // קריאת התחברות לשרת
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/api/auth/login`, { email, password })// POST לנתיב ההתחברות בבקאנד
      .pipe(
        tap((res) => {                                                           // תופעת לוואי אחרי קבלת תגובה
          if (res.ok && res.token && res.user) {                                 // ודא שיש הצלחה וגם token וגם user
            this.setAuthState(res.token, {                                       // שומר את מצב ההתחברות
              id: res.user.id,                                                   // מזהה משתמש
              email: res.user.email,                                             // אימייל
              role: res.user.role,                                               // תפקיד
            });
          }
        })
      );
  }

  logout() {                                                                     // יציאה מהמערכת
    this.tokenSignal.set(null);                                                  // מנקה טוקן מהסטייט
    this.userSignal.set(null);                                                   // מנקה משתמש מהסטייט
    localStorage.removeItem("mcp_token");                                        // מוחק טוקן מלוקאל סטורג'
    localStorage.removeItem("mcp_user");                                         // מוחק משתמש מלוקאל סטורג'
    this.router.navigate(["/login"]);                                            // מעביר את המשתמש למסך התחברות
  }

  private setAuthState(token: string, user: AuthUser) {                          // עדכון סטייט התחברות
    this.tokenSignal.set(token);                                                 // שומר טוקן בזיכרון
    this.userSignal.set(user);                                                   // שומר משתמש בזיכרון
    localStorage.setItem("mcp_token", token);                                    // שומר טוקן בלוקאל סטורג'
    localStorage.setItem("mcp_user", JSON.stringify(user));                      // שומר משתמש בלוקאל סטורג'
  }

  getToken(): string | null {                                                    // מחזיר את הטוקן הנוכחי
    return this.tokenSignal();                                                   // קורא את ערך הסטייט של הטוקן
  }
}
