import { Component, OnInit, inject } from "@angular/core";                           // קומפוננטה ו lifecycle
import { HttpClient } from "@angular/common/http";                                   // HTTP
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";       // טפסים
import { NgIf } from "@angular/common";                                              // NgIf

@Component({                                                                          // דקורטור קומפוננטה
  selector: "app-wookeys",                                                            // סלקטור
  standalone: true,                                                                   // standalone
  imports: [ReactiveFormsModule, NgIf],                                               // imports
  templateUrl: "./wookeys.component.html",                                            // HTML
  styleUrl: "./wookeys.component.scss",                                               // SCSS
})
export class WooKeysComponent implements OnInit {                                     // שם class תואם ל routes
  private http = inject(HttpClient);                                                  // HttpClient
  private fb = inject(FormBuilder);                                                   // FormBuilder

  loading = false;                                                                    // לשימוש בכפתורים וב UI
  error: string | null = null;                                                        // הודעת שגיאה
  success: string | null = null;                                                      // הודעת הצלחה
  clientKey: string | null = null;                                                    // המפתח שנוצר
  savedOnce = false;                                                                  // מאפשר generate רק אחרי update מוצלח

  private apiBase = "/api";                                                           // תמיד פרוקסי מהפרונט

  form = this.fb.nonNullable.group({                                                  // טופס
    store_name: [""],                                                                 // אופציונלי
    woo_url: ["", [Validators.required]],                                             // חובה
    woo_ck: ["", [Validators.required]],                                              // חובה
    woo_cs: ["", [Validators.required]],                                              // חובה
  });

  ngOnInit(): void {                                                                  // בעת טעינה
    this.loadExisting();                                                              // טעינה קיימת
  }

  private trimmed() {                                                                 // ניקוי רווחים
    const v = this.form.getRawValue();                                                // ערכים
    return {                                                                          // החזרה
      store_name: (v.store_name ?? "").trim(),                                        // store_name
      woo_url: (v.woo_url ?? "").trim(),                                              // woo_url
      woo_ck: (v.woo_ck ?? "").trim(),                                                // woo_ck
      woo_cs: (v.woo_cs ?? "").trim(),                                                // woo_cs
    };
  }

  canGenerate(): boolean {                                                            // תואם ל HTML שקורא canGenerate()
    const v = this.trimmed();                                                         // ערכים נקיים
    const hasAll = !!v.woo_url && !!v.woo_ck && !!v.woo_cs;                           // יש שלושתם
    return hasAll && this.savedOnce && !this.loading;                                 // רק אחרי update מוצלח
  }

  loadExisting(): void {                                                              // טעינה מהשרת
    this.http.get<any>(`${this.apiBase}/me/integrations`).subscribe({                 // בקשה
      next: (res) => {                                                                // הצלחה
        const data = res?.data ?? res;                                                // תמיכה בשני פורמטים
        this.form.patchValue({                                                        // מילוי טופס
          store_name: data?.store_name ?? "",                                         // store_name
          woo_url: data?.woo_url ?? "",                                               // woo_url
          woo_ck: data?.woo_ck ?? "",                                                 // woo_ck
          woo_cs: data?.woo_cs ?? "",                                                 // woo_cs
        });
        this.clientKey = data?.client_key ?? null;                                    // client_key אם קיים
      },
      error: () => {                                                                  // כישלון
        this.error = "Failed to load integration data";                               // הודעה
      },
    });
  }

  onUpdate(): void {                                                                  // לחיצה על Update
    this.error = null;                                                                // איפוס
    this.success = null;                                                              // איפוס
    const v = this.trimmed();                                                         // ערכים נקיים

    if (!v.woo_url || !v.woo_ck || !v.woo_cs) {                                       // בדיקת חובה
      this.error = "Please fill woo url and keys";                                    // הודעה
      return;                                                                         // עצירה
    }

    this.loading = true;                                                              // מצב טעינה
    this.http.put<any>(`${this.apiBase}/me/integrations`, v).subscribe({              // שמירה
      next: (res) => {                                                                // הצלחה
        this.loading = false;                                                         // סיום
        this.savedOnce = true;                                                        // מאפשר generate
        this.success = "Saved";                                                       // הודעת הצלחה
        const data = res?.data ?? res;                                                // נתונים
        this.clientKey = data?.client_key ?? this.clientKey;                          // אם חזר key
      },
      error: (err) => {                                                               // כישלון
        this.loading = false;                                                         // סיום
        this.error = err?.error?.error ?? "Update failed";                            // הודעה
      },
    });
  }

  onGenerate(): void {                                                                // תואם ל HTML שקורא onGenerate()
    this.error = null;                                                                // איפוס
    this.success = null;                                                              // איפוס

    if (!this.canGenerate()) {                                                        // אם לא אפשרי
      this.error = this.savedOnce ? "Please fill woo url and keys" : "Please click Update first"; // הודעה
      return;                                                                         // עצירה
    }

    this.loading = true;                                                              // מצב טעינה
    this.http.post<any>(`${this.apiBase}/me/client-key`, {}).subscribe({              // יצירת מפתח
      next: (res) => {                                                                // הצלחה
        this.loading = false;                                                         // סיום
        const data = res?.data ?? res;                                                // נתונים
        this.clientKey = data?.client_key ?? data?.clientKey ?? null;                 // שמירה למסך
        this.success = "Client key generated";                                        // הודעת הצלחה
      },
      error: (err) => {                                                               // כישלון
        this.loading = false;                                                         // סיום
        this.error = err?.error?.error ?? "Generate failed";                          // הודעה
      },
    });
  }

  async copyKey(): Promise<void> {                                                    // תואם ל HTML שקורא copyKey()
    this.error = null;                                                                // איפוס
    this.success = null;                                                              // איפוס
    if (!this.clientKey) return;                                                      // אין מה להעתיק

    try {                                                                             // ניסיון
      await navigator.clipboard.writeText(this.clientKey);                            // העתקה
      this.success = "Copied";                                                        // הצלחה
    } catch {                                                                         // כישלון
      this.error = "Copy failed";                                                     // הודעה
    }
  }
}
