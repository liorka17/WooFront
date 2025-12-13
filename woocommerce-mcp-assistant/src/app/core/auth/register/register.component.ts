import { Component } from '@angular/core';                                       // ייבוא דקורטור Component להגדרת קומפוננטה
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // ייבוא מודול טפסים ריאקטיביים וכלי ולידציה
import { NgIf, NgClass } from '@angular/common';                                 // ייבוא דיירקטיבים לתצוגה תנאית וקלאסים דינמיים
import { RouterModule, Router } from '@angular/router';                          // ייבוא RouterModule לתבנית ו Router לניווט בקוד
import { AuthService, RegisterRequest, RegisterResponse } from '../auth.service';// ייבוא AuthService וטיפוסים של רישום מהשירות

@Component({                                                                      // דקורטור שמגדיר את מאפייני הקומפוננטה
  selector: 'app-register',                                                      // שם הסלקטור של הקומפוננטה ב HTML
  standalone: true,                                                              // מציין שזו קומפוננטה עצמאית ללא מודול נפרד
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterModule],                  // רשימת מודולים שזמינים בתוך התבנית של הקומפוננטה
  templateUrl: './register.component.html',                                      // נתיב לקובץ תבנית ה HTML של הקומפוננטה
  styleUrl: './register.component.scss',                                         // נתיב לקובץ סגנונות ה SCSS של הקומפוננטה
})
export class RegisterComponent {                                                 // מחלקה שמייצגת את קומפוננטת הרישום
  registerForm: FormGroup;                                                       // שדה שמחזיק את אובייקט הטופס הריאקטיבי
  submitted = false;                                                             // דגל שמייצג אם המשתמש כבר ניסה לשלוח את הטופס
  loading = false;                                                               // דגל שמייצג מצב טעינה בזמן שליחת בקשה לשרת
  apiError: string | null = null;                                                // מחרוזת לשמירת הודעת שגיאה כללית מהשרת במקרה של כישלון

  constructor(                                                                   // בנאי הקומפוננטה
    private fb: FormBuilder,                                                     // הזרקה של FormBuilder ליצירת טופס ריאקטיבי
    private authService: AuthService,                                            // הזרקה של AuthService לצורך רישום משתמשים
    private router: Router                                                       // הזרקה של Router לצורך ניווט אחרי רישום
  ) {
    this.registerForm = this.fb.group({                                          // יצירת אובייקט הטופס והגדרת השדות שלו
      fullName: ['', [Validators.required, Validators.minLength(2)]],            // שדה שם מלא עם ולידציה של חובה ומינימום 2 תווים
      email: ['', [Validators.required, Validators.email]],                      // שדה אימייל עם ולידציה של חובה ומבנה אימייל תקין
      password: ['', [Validators.required, Validators.minLength(8)]],            // שדה סיסמה עם ולידציה של חובה ומינימום 8 תווים
      confirmPassword: ['', [Validators.required]],                              // שדה אישור סיסמה שמסומן כחובה
      companyName: ['', [Validators.required]],                                  // שדה שם חברה חובה בצד לקוח בלבד כרגע
      phone: [''],                                                               // שדה טלפון שאינו חובה כרגע
      role: ['owner', [Validators.required]],                                    // שדה תפקיד עם ערך ברירת מחדל owner ולידציה של חובה
      storeUrl: ['', [Validators.required]],                                     // שדה כתובת חנות עם ולידציה של חובה
      plan: ['starter', [Validators.required]],                                  // שדה תכנית עם ערך ברירת מחדל starter ולידציה של חובה
      agree: [false, [Validators.requiredTrue]],                                 // סימון הסכמה לתנאים שמסומן כחובה להיות true
    });                                                                          // סיום הגדרת הטופס
  }

  get f(): any {                                                                 // גטר נוח לגישה לבקרי הטופס מהתבנית ומהקוד
    return this.registerForm.controls;                                           // מחזיר את אוסף הבקרים של הטופס
  }

  onSubmit(): void {                                                             // פונקציה שמופעלת בעת שליחת הטופס
    this.submitted = true;                                                       // מסמן שהמשתמש ניסה לשלוח את הטופס לפחות פעם אחת
    this.apiError = null;                                                        // מאפס הודעת שגיאה כללית קודמת אם הייתה

    if (this.registerForm.invalid) {                                             // אם הטופס לא עבר את כלול ולידציות הצד לקוח
      return;                                                                    // לא מבצעים רישום ולא שולחים בקשה לשרת
    }

    const password = this.f['password'].value;                                   // קריאת ערך שדה הסיסמה מהטופס
    const confirmPassword = this.f['confirmPassword'].value;                     // קריאת ערך שדה אישור הסיסמה מהטופס

    if (password !== confirmPassword) {                                          // בדיקה שהסיסמה ואישור הסיסמה זהים
      this.apiError = 'Passwords do not match.';                                 // הצגת הודעת שגיאה כללית אם יש אי התאמה
      return;                                                                    // יציאה מהפונקציה בלי לשלוח בקשה לשרת
    }

    const payload: RegisterRequest = {                                           // בניית גוף הבקשה לרישום לפי הממשק RegisterRequest
      fullName: this.f['fullName'].value,                                        // העתקת שם מלא מהטופס לגוף הבקשה
      email: this.f['email'].value,                                              // העתקת אימייל מהטופס לגוף הבקשה
      password: this.f['password'].value,                                        // העתקת סיסמה מהטופס לגוף הבקשה
      role: this.f['role'].value,                                                // העתקת תפקיד שנבחר לגוף הבקשה
      storeUrl: this.f['storeUrl'].value,                                        // העתקת כתובת החנות מהטופס לגוף הבקשה
      plan: this.f['plan'].value,                                                // העתקת התכנית שנבחרה לגוף הבקשה
    };                                                                           // סיום בניית האובייקט payload

    this.loading = true;                                                         // הפעלת דגל טעינה בזמן שהבקשה נשלחת לשרת

    this.authService.register(payload).subscribe({                               // קריאה לשירות ההזדהות לביצוע רישום בפועל
      next: (res: RegisterResponse) => {                                         // פונקציה שמטפלת בתגובה תקינה מהשרת
        this.loading = false;                                                    // כיבוי דגל הטעינה לאחר קבלת תגובה

        if (res.ok && res.user) {                                                // אם השרת החזיר שהרישום הצליח ויש אובייקט user
          alert('Account created successfully. Please log in to continue.');     // הצגת הודעת הצלחה למשתמש בצד לקוח
          this.router.navigate(['/login']);                                      // ניווט למסך התחברות אחרי רישום מוצלח
        } else {                                                                 // במקרה ש ok שווה false או שאין user בתגובה
          this.apiError =                                                       // שמירת הודעת השגיאה שתוצג למשתמש
            res.error || 'Registration failed. Please try again.';              // שימוש בהודעת השרת או הודעה כללית במקרה שאין
        }                                                                        // סיום התנאי
      },                                                                         // סיום פונקציית next
      error: (err) => {                                                          // פונקציה שמטפלת במקרה של שגיאת HTTP או תקשורת
        this.loading = false;                                                    // כיבוי דגל הטעינה גם במקרה של שגיאה
        this.apiError =                                                          // שמירת הודעת השגיאה שתוצג למשתמש
          err?.error?.error || 'Server error during registration. Please try again.'; // שימוש בהודעת השרת אם קיימת או הודעה כללית
      },                                                                         // סיום פונקציית error
    });                                                                          // סיום קריאת subscribe ל Observable
  }
}
