import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  private fb = inject(FormBuilder);               // שירות לבניית טפסים ריאקטיביים
  private auth = inject(AuthService);             // שירות הזדהות שלנו
  private router = inject(Router);                // ניתוב באנגולר
  private route = inject(ActivatedRoute);         // גישה לפרמטרים בכתובת

  loading = false;                                // מצב טעינה של כפתור ההתחברות
  errorMessage: string | null = null;            // הודעת שגיאה לתצוגה במסך

  // טופס התחברות – כולל שדה remember כמו ב־HTML
  loginForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]], // אימייל חובה + ולידציה
    password: ["", [Validators.required]],                // סיסמה חובה
    remember: [false],                                   // צ'קבוקס "זכור אותי"
  });

  // גישה נוחה לבקרי הטופס אם נרצה בעתיד
  get f() {
    return this.loginForm.controls;
  }

  // נקרא מה־(ngSubmit) בטופס
  onSubmit() {
    if (this.loginForm.invalid || this.loading) {        // אם הטופס לא תקין או שכבר בטיפול
      this.loginForm.markAllAsTouched();                 // מסמן את כל השדות כ־touched
      return;
    }

    this.errorMessage = null;                            // איפוס הודעת השגיאה
    this.loading = true;                                 // מסמן שהבקשה יוצאת

    const email = this.loginForm.value.email as string;  // שליפת אימייל מהטופס
    const password = this.loginForm.value.password as string; // שליפת סיסמה

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;

        if (!res.ok) {                                   // אם השרת החזיר כישלון
          this.errorMessage = res.error || "Login failed";
          return;
        }

        // אחרי התחברות מוצלחת – ניווט לכתובת שרצו במקור או לדשבורד
        const returnUrl =
          this.route.snapshot.queryParamMap.get("returnUrl") ||
          "/app/dashboard";

        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        // הודעת שגיאה מכיוון ה־HTTP
        this.errorMessage = err?.error?.error || "Login failed";
      },
    });
  }
}
