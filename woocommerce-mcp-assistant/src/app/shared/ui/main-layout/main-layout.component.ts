import { Component, computed, inject } from "@angular/core";                       // ייבוא Component ו computed ו inject
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";      // ייבוא Router directives
import { NgIf } from "@angular/common";                                            // ייבוא NgIf
import { AuthService } from "../../../core/auth/auth.service";                     // נתיב מתוקן לשירות

@Component({                                                                       // דקורטור קומפוננטה
  selector: "app-main-layout",                                                     // selector
  standalone: true,                                                                // קומפוננטה עצמאית
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],                     // imports לתבנית
  templateUrl: "./main-layout.component.html",                                     // HTML
})                                                                                 // סוף Component
export class MainLayoutComponent {                                                 // מחלקת קומפוננטה
  private auth = inject(AuthService);                                              // הזרקת AuthService

  currentYear = new Date().getFullYear();                                          // שנה נוכחית לפוטר
  isAuthed = computed(() => this.auth.isAuthenticated());                          // האם מחובר לפי טוקן

  logout(): void {                                                                 // פעולה ליציאה
    this.auth.logout();                                                            // יציאה דרך השירות
  }                                                                                // סוף logout
}                                                                                  // סוף class
