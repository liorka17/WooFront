import { Component } from "@angular/core";                                              // מייבא את דקורטור הקומפוננטה מאנגולר
import {                                                                              // מייבא מחלקות עבור טופס ריאקטיבי
  ReactiveFormsModule,                                                                // מודול לטפסים ריאקטיביים
  FormBuilder,                                                                        // יוצר אובייקטי FormGroup בצורה נוחה
  FormGroup,                                                                          // מייצג טופס ריאקטיבי
  Validators,                                                                         // אוסף ולידטורים מוכנים
} from "@angular/forms";
import { NgIf, NgClass, NgFor } from "@angular/common";                               // דיירקטיבים מובנים לתבנית *ngIf, *ngClass, *ngFor
import { RouterModule, Router } from "@angular/router";                               // ראוטר של אנגולר לניווט ושימוש ב routerLink
import { HttpClient, HttpErrorResponse } from "@angular/common/http";                 // לקוח HTTP ושגיאת HTTP לטיפול בתשובה מהשרת

interface RegisterResponse {                                                          // ממשק לתשובת הרשמה מהשרת
  ok: boolean;                                                                        // האם הבקשה הצליחה בצד השרת
  user?: any;                                                                         // אובייקט משתמש שהשרת מחזיר במקרה הצורך
  error?: string;                                                                     // הודעת שגיאה מהשרת אם יש
}

@Component({
  selector: "app-register",                                                           // שם תגית הקומפוננטה ב HTML
  standalone: true,                                                                   // קומפוננטה עצמאית ללא מודול
  imports: [ReactiveFormsModule, NgIf, NgClass, NgFor, RouterModule],                 // מודולים ודיירקטיבים שהקומפוננטה משתמשת בהם
  templateUrl: "./register.component.html",                                           // קובץ תבנית HTML של הקומפוננטה
  styleUrl: "./register.component.scss",                                              // קובץ עיצוב SCSS של הקומפוננטה
})
export class RegisterComponent {                                                      // מחלקת הקומפוננטה של דף ההרשמה
  registerForm: FormGroup;                                                            // אובייקט הטופס הריאקטיבי
  submitted = false;                                                                  // דגל האם המשתמש ניסה להגיש את הטופס
  loading = false;                                                                    // דגל האם יש כרגע בקשת הרשמה פעילה לשרת

  // overlay / card של הצלחה אחרי הרשמה
  successToast = false;                                                               // דגל האם להציג שכבת הצלחה מעל הטופס
  successMessage =                                                                    // טקסט ההודעה שמופיעה למעלה אחרי הרשמה מוצלחת
    "Account created successfully. Continue to your dashboard to finish setup.";

  // שגיאה כללית מהשרת
  serverError: string | null = null;                                                  // מחרוזת שגיאה כללית מהשרת במקרה של כישלון

  // סיכום שגיאות למעלה
  errorSummary: string[] = [];                                                        // מערך של שורות שגיאה להצגה בראש הכרטיס

  // הצגת או הסתרת סיסמאות
  showPassword = false;                                                               // האם להראות את שדה הסיסמא כטקסט גלוי
  showConfirmPassword = false;                                                        // האם להראות את שדה אישור הסיסמא כטקסט גלוי

  private baseUrl = "http://localhost:3000";                                          // בסיס כתובת הבקאנד של Fastify

  // כאן אפשר לשנות בקלות את הנתיב של הדשבורד
  private dashboardRoute: string[] = ["/admin"];                                      // נתיב הניווט אחרי לחיצה על Continue

  constructor(                                                                        // בנאי הקומפוננטה
    private fb: FormBuilder,                                                          // הזרקת FormBuilder ליצירת הטופס
    private http: HttpClient,                                                         // הזרקת HttpClient לשליחת בקשת הרשמה
    private router: Router                                                            // הזרקת Router לניווט אחרי הצלחה
  ) {
    this.registerForm = this.fb.group({                                               // יצירת מבנה הטופס ושיוך ולידטורים
      fullName: ["", [Validators.required, Validators.minLength(2)]],                 // שם מלא חובה באורך מינימלי 2
      email: ["", [Validators.required, Validators.email]],                           // אימייל חובה בפורמט תקין
      password: ["", [Validators.required, Validators.minLength(8)]],                 // סיסמא חובה באורך מינימלי 8 תווים
      confirmPassword: ["", [Validators.required]],                                   // אישור סיסמא חובה
      companyName: ["", [Validators.required]],                                       // שם חברה או צוות חובה
      phone: [""],                                                                    // טלפון רשות בלבד ללא ולידציה
      role: ["owner", [Validators.required]],                                         // תפקיד המשתמש ברירת מחדל owner חובה
      storeUrl: ["", [Validators.required]],                                          // כתובת החנות חובה
      plan: ["starter", [Validators.required]],                                       // תוכנית ברירת מחדל starter חובה
      agree: [false, [Validators.requiredTrue]],                                      // חובה לסמן הסכמה לתנאים
    });
  }

  get f(): any {                                                                      // גטר נוח לקיצור גישה לפקדים של הטופס
    return this.registerForm.controls;                                                // מחזיר את האוסף של הפקדים
  }

  // איסוף שגיאות ולידציה למסך העליון
  private collectClientErrors(): string[] {                                           // פונקציה אוספת טקסטים של שגיאות ולידציה
    const errors: string[] = [];                                                      // יוצר מערך ריק לשגיאות

    if (this.f["fullName"].invalid) {                                                 // אם שם מלא לא תקין
      errors.push("Full name is required (at least 2 characters).");                 // מוסיף שורה מתאימה לרשימת השגיאות
    }
    if (this.f["email"].invalid) {                                                    // אם אימייל לא תקין
      errors.push("A valid work email is required.");                                // מוסיף שורה מתאימה
    }
    if (this.f["companyName"].invalid) {                                              // אם שם חברה לא תקין
      errors.push("Company / team name is required.");                               // מוסיף שורה מתאימה
    }
    if (this.f["password"].invalid) {                                                 // אם הסיסמא לא עומדת בדרישות
      errors.push("Password must be at least 8 characters long.");                   // מוסיף שורה מתאימה
    }
    if (                                                                               // בדיקה לאישור סיסמא
      this.f["confirmPassword"].invalid ||                                            // אם שדה אישור סיסמא עצמו לא תקין
      this.f["confirmPassword"].value !== this.f["password"].value                   // או אם הערך לא שווה לערך הסיסמא
    ) {
      errors.push("Passwords must match.");                                          // מוסיף שורה שהסיסמאות חייבות להיות זהות
    }
    if (this.f["storeUrl"].invalid) {                                                 // אם כתובת החנות לא תקינה
      errors.push("Primary WooCommerce store URL is required.");                     // מוסיף שורה מתאימה
    }
    if (this.f["agree"].invalid) {                                                    // אם לא סומנו תנאי השירות
      errors.push("You must accept the Terms of Service to continue.");              // מוסיף שורה מתאימה
    }

    return errors;                                                                    // מחזיר את רשימת השגיאות
  }

  private clearPasswords() {                                                          // פונקציה לניקוי שדות הסיסמא
    this.registerForm.patchValue({                                                    // מעדכנת חלקית את הטופס
      password: "",                                                                   // מרוקן את שדה הסיסמא
      confirmPassword: "",                                                            // מרוקן את שדה אישור הסיסמא
    });
  }

  onSubmit() {                                                                        // פונקציה שרצה בעת שליחת הטופס
    this.submitted = true;                                                            // מסמן שנוצר ניסיון שליחה
    this.serverError = null;                                                          // מנקה שגיאת שרת קודמת אם הייתה
    this.errorSummary = [];                                                           // מנקה סיכום שגיאות קיים
    this.successToast = false;                                                        // מסתיר הודעת הצלחה קודמת אם הייתה

    this.registerForm.markAllAsTouched();                                             // מסמן את כל הפקדים כ touched כדי שיראו שגיאות

    const clientErrors = this.collectClientErrors();                                  // אוסף שגיאות ולידציה מצד הלקוח
    if (clientErrors.length > 0) {                                                    // אם יש שגיאות
      this.errorSummary = clientErrors;                                               // מציג אותן בראש הטופס
      this.clearPasswords();                                                          // מנקה את שדות הסיסמא כדי שלא יישמרו
      return;                                                                         // מפסיק את תהליך ההרשמה
    }

    if (this.registerForm.invalid) {                                                  // בדיקת גיבוי שאכן הטופס תקין
      this.clearPasswords();                                                          // מנקה סיסמאות ליתר ביטחון
      return;                                                                         // מפסיק אם עדיין לא תקין
    }

    const payload = {                                                                 // יוצר אובייקט נתונים לבקשת ההרשמה
      fullName: this.f["fullName"].value.trim(),                                      // שם מלא אחרי טרים
      email: this.f["email"].value.trim().toLowerCase(),                              // אימייל אחרי טרים ואותיות קטנות
      password: this.f["password"].value,                                             // סיסמא כמו שהוזנה
      role: this.f["role"].value,                                                     // תפקיד שנבחר
      storeUrl: this.f["storeUrl"].value.trim(),                                      // כתובת חנות אחרי טרים
      plan: this.f["plan"].value,                                                     // תוכנית שנבחרה
      // companyName + phone אפשר להוסיף לסכמה בבקאנד בהמשך לפי הצורך           // הערה מה לנהל בעתיד
    };

    this.loading = true;                                                              // מדליק מצב טעינה כדי לנעול כפתור

    this.http                                                                       // שימוש ב HttpClient
      .post<RegisterResponse>(`${this.baseUrl}/api/auth/register`, payload)          // שליחת בקשת POST לנתיב ההרשמה
      .subscribe({                                                                   // רישום למנוי על התשובה
        next: (res) => {                                                             // מטפל בתשובה מוצלחת מהשרת
          console.log("Register response:", res);                                    // לוג לקונסול לצורך דיבוג

          if (res.ok) {                                                              // אם השרת החזיר ok true
            this.errorSummary = [];                                                  // מנקה רשימת שגיאות
            this.serverError = null;                                                 // מנקה שגיאת שרת

            this.submitted = false;                                                  // מאפס מצב submitted כי כבר הצליח
            this.registerForm.reset({                                                // מאפס את ערכי הטופס לברירת מחדל
              fullName: "",                                                          // מנקה שם מלא
              email: "",                                                             // מנקה אימייל
              password: "",                                                          // מנקה סיסמא
              confirmPassword: "",                                                   // מנקה אישור סיסמא
              companyName: "",                                                       // מנקה שם חברה
              phone: "",                                                             // מנקה טלפון
              role: "owner",                                                         // מחזיר תפקיד לברירת מחדל
              storeUrl: "",                                                          // מנקה כתובת חנות
              plan: "starter",                                                       // מחזיר תוכנית לברירת מחדל
              agree: false,                                                          // מוריד סימון תנאי שימוש
            });
            this.registerForm.markAsPristine();                                      // מסמן שהטופס נקי
            this.registerForm.markAsUntouched();                                     // מסמן שהפקדים לא נגעו בהם

            this.showPassword = false;                                               // מחזיר סיסמא למצב מוסתר
            this.showConfirmPassword = false;                                        // מחזיר אישור סיסמא למצב מוסתר

            this.successToast = true;                                                // מפעיל את שכבת ההצלחה עם כפתור המשך
          } else {                                                                   // אם ok הוא false
            const msg =                                                              // בוחר הודעת שגיאה מתאימה
              res.error || "Registration failed. Please check your details.";
            this.serverError = msg;                                                  // שומר הודעת שגיאה להצגה
            this.errorSummary = [msg];                                               // מציג אותה גם בסיכום השגיאות
            this.clearPasswords();                                                   // מנקה שדות סיסמא
          }
        },
        error: (err: HttpErrorResponse) => {                                         // טיפול בשגיאת רשת או שגיאת שרת
          console.error("Register error:", err);                                     // לוג שגיאה בקונסול

          let msg = "Server error. Please try again.";                               // הודעת ברירת מחדל
          if (err.status === 409) {                                                  // אם יש קוד 409 מהשרת
            msg = "A user with this email already exists.";                          // משתמש קיים כבר
          } else if (err.status === 400) {                                           // אם יש קוד 400
            msg = "Missing or invalid fields. Please check the form.";               // שדות חסרים או לא תקינים
          }

          this.serverError = msg;                                                    // שמירת הודעת השגיאה
          this.errorSummary = [msg];                                                 // הצגת השגיאה למעלה
          this.clearPasswords();                                                     // ניקוי שדות סיסמא להגנה
        },
        complete: () => {                                                            // פונקציה שרצה בסיום המנוי
          this.loading = false;                                                      // מכבה מצב טעינה
        },
      });
  }

  // קריאה מכפתור Continue to my dashboard
  onContinueToDashboard() {                                                          // פונקציה שמופעלת בלחיצה על כפתור ההמשך
    this.successToast = false;                                                       // מסתיר את שכבת ההצלחה
    this.router.navigate(this.dashboardRoute);                                       // מנווט לנתיב הדשבורד שהוגדר
  }
}
