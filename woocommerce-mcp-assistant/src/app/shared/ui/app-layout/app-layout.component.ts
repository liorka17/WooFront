import { Component, computed, inject } from "@angular/core";                       // ייבוא Component, computed, inject
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";      // ייבוא Router
import { NgIf } from "@angular/common";                                            // ייבוא NgIf
import { AuthService } from "../../../core/auth/auth.service";                     // ייבוא AuthService

@Component({                                                                        // דקורטור קומפוננטה
  selector: "app-app-layout",                                                       // סלקטור
  standalone: true,                                                                 // קומפוננטה עצמאית
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],                      // imports לתבנית
  templateUrl: "./app-layout.component.html",                                       // HTML
  styleUrl: "./app-layout.component.scss",                                          // SCSS
})                                                                                  // סוף Component
export class AppLayoutComponent {                                                   // קומפוננטה
  private auth = inject(AuthService);                                               // הזרקת AuthService בלי constructor

  user = this.auth.user;                                                            // signal של המשתמש המחובר
  isAdmin = computed(() => this.user()?.role === "admin");                          // בדיקה אם המשתמש אדמין

  logout(): void {                                                                  // פונקציית יציאה
    this.auth.logout();                                                             // יציאה וניקוי state
  }                                                                                 // סוף logout
}                                                                                   // סוף class
