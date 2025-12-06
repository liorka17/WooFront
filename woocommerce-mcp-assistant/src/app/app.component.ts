import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root', // זה ה-Selector שה-index.html שלך משתמש בו
  standalone: true,
  imports: [RouterOutlet], // עכשיו הוא משתמש ב-RouterOutlet כדי לטעון את ה-Routes שהגדרנו
  template: `
    <!-- RouterOutlet יטען את ה-Layout הראשי (main-layout.component) בהתאם לנתיב -->
    <router-outlet></router-outlet>
  `,
  // אנחנו מוחקים את הקבצים app.component.html ו-app.component.scss הישנים כי הכל ב-inline
  styles: `
    /* וודא שהגוף תופס 100% גובה */
    :host {
      display: block;
      height: 100%;
    }
  `
})
export class AppComponent {
  title = 'WooCommerce-MCP-AI-Assistant';
}