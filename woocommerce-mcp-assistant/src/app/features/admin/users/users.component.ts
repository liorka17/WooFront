import { Component, OnInit } from "@angular/core";                                  // ייבוא קומפוננטה ו OnInit
import { HttpClient, HttpHeaders } from "@angular/common/http";                     // ייבוא HttpClient וגם HttpHeaders
import { NgIf, NgFor } from "@angular/common";                                      // ייבוא דירקטיבות בסיסיות
import { environment } from "../../../../environments/environment";                 // ייבוא environment

type UserRow = {                                                                    // טיפוס משתמש לתצוגה
  id: number | string;                                                              // מזהה
  fullName: string;                                                                 // שם מלא
  email: string;                                                                    // אימייל
  role: string;                                                                     // תפקיד
  storeName: string;                                                                // שם חנות
  storeUrl: string;                                                                 // כתובת חנות
  plan: string;                                                                     // תכנית
  createdAt?: string;                                                               // תאריך יצירה אופציונלי
};                                                                                  // סוף טיפוס

@Component({                                                                         // דקורטור קומפוננטה
  selector: "app-users",                                                             // שם סלקטור
  standalone: true,                                                                  // קומפוננטה עצמאית
  imports: [NgIf, NgFor],                                                            // imports לתבנית
  templateUrl: "./users.component.html",                                             // קובץ HTML
  styleUrl: "./users.component.scss",                                                // קובץ SCSS
})                                                                                   // סוף Component
export class UsersComponent implements OnInit {                                      // קומפוננטה
  loading = false;                                                                   // מצב טעינה
  error: string | null = null;                                                       // הודעת שגיאה
  users: UserRow[] = [];                                                             // רשימת משתמשים

  private apiBase = environment.apiBase;                                             // בסיס API, צריך להיות "/api"
  private tokenKey = "mcp_token";                                                    // המפתח של הטוקן בלוקאל סטורג

  constructor(private http: HttpClient) {}                                           // בנאי עם HttpClient

  ngOnInit(): void {                                                                 // בעת טעינה
    this.loadUsers();                                                                // טוען משתמשים
  }                                                                                  // סוף ngOnInit

  loadUsers(): void {                                                                // פונקציה לטעינת משתמשים
    this.loading = true;                                                             // מתחיל טעינה
    this.error = null;                                                               // מאפס שגיאה

    const token = localStorage.getItem(this.tokenKey) ?? "";                         // קורא טוקן מהדפדפן
    const headers = token                                                            // אם יש טוקן
      ? new HttpHeaders({ Authorization: "Bearer " + token })                        // מוסיף Authorization כמו שצריך
      : new HttpHeaders();                                                           // אחרת שולח בלי

    this.http.get<any>(`${this.apiBase}/users`, { headers }).subscribe({             // בקשה לשרת עם headers
      next: (res) => {                                                               // הצלחה
        this.users = (res?.users ?? []) as UserRow[];                                // שמירת המשתמשים
        this.loading = false;                                                        // סיום טעינה
      },                                                                             // סוף next
      error: (err) => {                                                              // כישלון
        this.loading = false;                                                        // סיום טעינה
        this.error = err?.error?.error ?? "Failed to load users";                    // הודעת שגיאה
      },                                                                             // סוף error
    });                                                                              // סוף subscribe
  }                                                                                  // סוף loadUsers
}                                                                                    // סוף class
