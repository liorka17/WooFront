import { Component, OnInit } from "@angular/core";                                  // ייבוא קומפוננטה ו OnInit
import { HttpClient } from "@angular/common/http";                                  // ייבוא HttpClient
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

  private apiBase = environment.apiBase;                                             // בסיס API חייב להיות /api כדי לעבוד עם proxy

  constructor(private http: HttpClient) {}                                           // בנאי עם HttpClient

  ngOnInit(): void {                                                                 // בעת טעינה
    console.log("UsersComponent init, apiBase =", this.apiBase);                     // לוג כדי לוודא מה הערך בפועל
    this.loadUsers();                                                                // טוען משתמשים
  }                                                                                  // סוף ngOnInit

  loadUsers(): void {                                                                // פונקציה לטעינת משתמשים
    this.loading = true;                                                             // מתחיל טעינה
    this.error = null;                                                               // מאפס שגיאה

    const url = `${this.apiBase}/users`;                                             // בניית כתובת הבקשה
    console.log("Calling users url =", url);                                         // לוג כתובת

    this.http.get<{ ok: boolean; users: UserRow[] }>(url).subscribe({                // בקשה לשרת ל users
      next: (res) => {                                                               // הצלחה
        console.log("Users response =", res);                                        // לוג תשובה
        this.users = res?.users ?? [];                                               // שמירת המשתמשים
        this.loading = false;                                                        // סיום טעינה
      },                                                                             // סוף next
      error: (err) => {                                                              // כישלון
        console.error("Users error =", err);                                         // לוג שגיאה מלא
        this.loading = false;                                                        // סיום טעינה
        this.error = err?.error?.error ?? "Failed to load users";                    // הודעת שגיאה
      },                                                                             // סוף error
    });                                                                              // סוף subscribe
  }                                                                                  // סוף loadUsers
}                                                                                    // סוף class
