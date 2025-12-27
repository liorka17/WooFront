import { Component, inject } from "@angular/core";                               // מייבא Component ו inject לשימוש בהזרקות מודרניות
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms"; // מייבא טפסים ריאקטיביים וכלי בנייה
import { NgIf, NgClass, NgFor } from "@angular/common";                          // דיירקטיבים לתבנית
import { RouterModule, Router, ActivatedRoute } from "@angular/router";          // מייבא Router ו ActivatedRoute לניווט ו returnUrl
import { AuthService } from "../auth.service";                                   // מייבא את שירות ההזדהות כדי לבצע register ו login

@Component({
  selector: "app-register",                                                      // שם תגית הקומפוננטה
  standalone: true,                                                              // קומפוננטה עצמאית
  imports: [ReactiveFormsModule, NgIf, NgClass, NgFor, RouterModule],            // מודולים שהתבנית משתמשת בהם
  templateUrl: "./register.component.html",                                      // קובץ HTML
  styleUrl: "./register.component.scss",                                         // קובץ SCSS
})
export class RegisterComponent {                                                 // מחלקת RegisterComponent
  private fb = inject(FormBuilder);                                              // שירות לבניית טפסים
  private auth = inject(AuthService);                                            // שירות Auth מרכזי
  private router = inject(Router);                                               // Router לניווט
  private route = inject(ActivatedRoute);                                        // גישה ל returnUrl אם קיים

  registerForm: FormGroup;                                                       // אובייקט הטופס
  submitted = false;                                                             // דגל ניסיון שליחה
  loading = false;                                                               // מצב טעינה

  successToast = false;                                                          // האם להציג שכבת הצלחה
  successMessage = "Creating account. Signing you in...";                        // הודעת מצב עבור AUTO

  serverError: string | null = null;                                             // הודעת שגיאה כללית
  errorSummary: string[] = [];                                                   // סיכום שגיאות למעלה

  showPassword = false;                                                          // הצגת סיסמה
  showConfirmPassword = false;                                                   // הצגת אישור סיסמה

  constructor() {                                                                // בנאי
    this.registerForm = this.fb.group({                                          // יצירת הטופס
      fullName: ["", [Validators.required, Validators.minLength(2)]],            // שם מלא
      email: ["", [Validators.required, Validators.email]],                      // אימייל
      password: ["", [Validators.required, Validators.minLength(8)]],            // סיסמה
      confirmPassword: ["", [Validators.required]],                              // אישור סיסמה
      companyName: ["", [Validators.required]],                                  // שם חברה נדרש בצד לקוח לפי UI
      phone: [""],                                                               // טלפון אופציונלי
      role: ["owner", [Validators.required]],                                    // תפקיד
      storeName: ["", [Validators.required]],                                    // שם חנות חובה
      storeUrl: ["", [Validators.required]],                                     // כתובת חנות חובה
      plan: ["starter", [Validators.required]],                                  // תוכנית
      agree: [false, [Validators.requiredTrue]],                                 // תנאים
    });                                                                          // סוף טופס
  }                                                                              // סוף בנאי

  get f(): any {                                                                 // גטר לגישה נוחה לפקדים
    return this.registerForm.controls;                                           // מחזיר את הפקדים
  }                                                                              // סוף גטר

  private collectClientErrors(): string[] {                                      // אוסף שגיאות ולידציה
    const errors: string[] = [];                                                 // מערך שגיאות

    if (this.f["fullName"].invalid) errors.push("Full name is required (at least 2 characters)."); // בדיקת שם
    if (this.f["email"].invalid) errors.push("A valid work email is required.");                   // בדיקת אימייל
    if (this.f["companyName"].invalid) errors.push("Company / team name is required.");            // בדיקת חברה
    if (this.f["password"].invalid) errors.push("Password must be at least 8 characters long.");   // בדיקת סיסמה

    if (this.f["confirmPassword"].invalid || this.f["confirmPassword"].value !== this.f["password"].value) { // בדיקת התאמה
      errors.push("Passwords must match.");                                       // הודעת התאמה
    }

    if (this.f["storeName"].invalid) errors.push("Store name is required.");      // בדיקת storeName
    if (this.f["storeUrl"].invalid) errors.push("Primary WooCommerce store URL is required."); // בדיקת storeUrl
    if (this.f["agree"].invalid) errors.push("You must accept the Terms of Service to continue."); // בדיקת agree

    return errors;                                                               // מחזיר שגיאות
  }                                                                              // סוף collectClientErrors

  private clearPasswords(): void {                                               // ניקוי שדות סיסמה
    this.registerForm.patchValue({ password: "", confirmPassword: "" });         // מרוקן את השדות
  }                                                                              // סוף clearPasswords

  onSubmit(): void {                                                             // שליחת הטופס
    if (this.loading) return;                                                    // אם כבר בטעינה לא מאפשר שליחה כפולה

    this.submitted = true;                                                       // מסמן ניסיון שליחה
    this.serverError = null;                                                     // מנקה שגיאה קודמת
    this.errorSummary = [];                                                      // מנקה סיכום שגיאות
    this.successToast = false;                                                   // מסתיר הצלחה קודמת

    this.registerForm.markAllAsTouched();                                        // מסמן את כולם כדי להציג שגיאות

    const clientErrors = this.collectClientErrors();                             // אוסף שגיאות צד לקוח
    if (clientErrors.length > 0) {                                               // אם יש שגיאות
      this.errorSummary = clientErrors;                                          // מציג למעלה
      this.clearPasswords();                                                     // מנקה סיסמאות
      return;                                                                    // עוצר
    }

    if (this.registerForm.invalid) {                                             // בדיקת גיבוי
      this.clearPasswords();                                                     // מנקה סיסמאות
      return;                                                                    // עוצר
    }

    const email = (this.f["email"].value as string).trim().toLowerCase();        // שומר אימייל לשימוש גם בלוגין
    const password = this.f["password"].value as string;                         // שומר סיסמה לשימוש בלוגין לפני ניקוי

    const payload = {                                                           // יוצר גוף הרשמה לבקאנד
      fullName: (this.f["fullName"].value as string).trim(),                     // שם מלא
      email,                                                                     // אימייל
      password,                                                                  // סיסמה
      role: this.f["role"].value,                                                // תפקיד
      storeName: (this.f["storeName"].value as string).trim(),                   // שם חנות
      storeUrl: (this.f["storeUrl"].value as string).trim(),                     // כתובת חנות
      plan: this.f["plan"].value,                                                // תוכנית
      companyName: (this.f["companyName"].value as string)?.trim(),              // אופציונלי לעתיד
      phone: (this.f["phone"].value as string)?.trim(),                          // אופציונלי לעתיד
    };                                                                           // סוף payload

    this.loading = true;                                                         // מצב טעינה
    this.successToast = true;                                                    // מציג שכבת מצב כדי להראות שמתקדם

    this.auth.register(payload).subscribe({                                      // מבצע הרשמה דרך AuthService
      next: (regRes) => {                                                        // תשובת register
        if (!regRes.ok) {                                                        // אם נכשל
          const msg = regRes.error || "Registration failed. Please check your details."; // הודעה
          this.serverError = msg;                                                // שמירת שגיאה
          this.errorSummary = [msg];                                             // הצגה למעלה
          this.successToast = false;                                             // מסתיר שכבת הצלחה
          this.clearPasswords();                                                 // ניקוי סיסמאות
          this.loading = false;                                                  // מכבה טעינה
          return;                                                                // עוצר
        }

        this.auth.login(email, password).subscribe({                             // AUTO LOGIN אחרי register מוצלח
          next: (loginRes) => {                                                  // תשובת login
            if (!loginRes.ok) {                                                  // אם login נכשל
              const msg = loginRes.error || "Account created, but login failed. Please login."; // הודעה
              this.serverError = msg;                                            // שמירת שגיאה
              this.errorSummary = [msg];                                         // הצגה
              this.successToast = false;                                         // מסתיר שכבת הצלחה
              this.clearPasswords();                                             // ניקוי סיסמאות
              this.loading = false;                                              // מכבה טעינה
              this.router.navigate(["/login"]);                                  // מעביר למסך התחברות
              return;                                                            // עוצר
            }

            const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl") || "/app/dashboard"; // יעד
            this.loading = false;                                                // מכבה טעינה
            this.clearPasswords();                                               // ניקוי סיסמאות
            this.router.navigateByUrl(returnUrl);                                // ניווט ליעד אחרי התחברות
          },
          error: (err) => {                                                      // שגיאת HTTP בלוגין
            const msg = err?.error?.error || "Account created, but login failed. Please login."; // הודעה
            this.serverError = msg;                                              // שמירה
            this.errorSummary = [msg];                                           // הצגה
            this.successToast = false;                                           // הסתרה
            this.clearPasswords();                                               // ניקוי
            this.loading = false;                                                // כיבוי טעינה
            this.router.navigate(["/login"]);                                    // מעבר ללוגין
          },
        });                                                                      // סוף subscribe של login
      },
      error: (err) => {                                                          // שגיאת HTTP ברישום
        let msg = "Server error. Please try again.";                             // הודעת ברירת מחדל
        if (err?.status === 409) msg = "A user with this email already exists."; // טיפול ב 409
        if (err?.status === 400) msg = "Missing or invalid fields. Please check the form."; // טיפול ב 400

        this.serverError = msg;                                                  // שמירה
        this.errorSummary = [msg];                                               // הצגה
        this.successToast = false;                                               // הסתרה
        this.clearPasswords();                                                   // ניקוי
        this.loading = false;                                                    // כיבוי טעינה
      },
    });                                                                          // סוף subscribe של register
  }       
  onContinueToDashboard(): void {                                                   // פונקציה שנקראת מהתבנית כדי לעבור לדשבורד
  this.successToast = false;                                                      // מסתיר את שכבת ההצלחה אם היא פתוחה
  this.router.navigateByUrl("/app/dashboard");                                    // מנווט לדשבורד של אזור האפליקציה
}                                                                                 // סוף פונקציה
                                                                       // סוף onSubmit
}                                                                                // סוף RegisterComponent
