import { Routes } from "@angular/router";                                                                 // מייבא את הטיפוס Routes להגדרת מערך הנתיבים
import { authGuard } from "./core/auth/auth.guard";                                                       // מייבא Guard לאימות התחברות לפני כניסה לאפליקציה
import { adminGuard } from "./core/auth/admin.guard";                                                     // מייבא Guard לאימות אדמין לפני כניסה לאזור admin

export const routes: Routes = [                                                                           // מייצא את מערך הראוטים הראשי של האפליקציה
  {
    path: "",                                                                                             // נתיב השורש של האתר הציבורי
    loadComponent: () =>                                                                                  // טוען קומפוננטת layout ציבורית בצורה עצלה
      import("./shared/ui/main-layout/main-layout.component")                                              // טוען את קובץ ה layout הציבורי
        .then((m) => m.MainLayoutComponent),                                                              // מחזיר את MainLayoutComponent מהמודול הטעון
    children: [                                                                                           // ילדים של ה layout הציבורי
      {
        path: "",                                                                                         // נתיב ריק בתוך ה layout הציבורי
        loadComponent: () =>                                                                              // טעינת קומפוננטת הבית בצורה עצלה
          import("./features/home/home.component")                                                        // טוען את קומפוננטת הבית
            .then((m) => m.HomeComponent),                                                                // מחזיר את HomeComponent
      },
      {
        path: "pricing",                                                                                  // נתיב לעמוד התמחור
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת התמחור
          import("./features/pricing/pricing.component")                                                  // טוען את קובץ התמחור
            .then((m) => m.PricingComponent),                                                             // מחזיר את PricingComponent
      },
      {
        path: "login",                                                                                    // נתיב לעמוד ההתחברות
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת ההתחברות
          import("./core/auth/login/login.component")                                                     // טוען את קובץ ההתחברות
            .then((m) => m.LoginComponent),                                                               // מחזיר את LoginComponent
      },
      {
        path: "register",                                                                                 // נתיב לעמוד ההרשמה
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת ההרשמה
          import("./core/auth/register/register.component")                                               // טוען את קובץ ההרשמה
            .then((m) => m.RegisterComponent),                                                            // מחזיר את RegisterComponent
      },
    ],
  },

  {
    path: "app",                                                                                          // בסיס האפליקציה למשתמשים מחוברים
    canActivate: [authGuard],                                                                             // מגן על כל אזור /app ודורש התחברות
    loadComponent: () =>                                                                                  // טעינת layout האפליקציה בצורה עצלה
      import("./shared/ui/app-layout/app-layout.component")                                               // טוען את קובץ ה layout של האפליקציה
        .then((m) => m.AppLayoutComponent),                                                               // מחזיר את AppLayoutComponent
    children: [                                                                                           // ילדים של אזור האפליקציה
      {
        path: "",                                                                                         // נתיב ריק בתוך /app
        redirectTo: "dashboard",                                                                          // מפנה לדשבורד כברירת מחדל
        pathMatch: "full",                                                                                // מפעיל הפניה רק אם הנתיב ריק לחלוטין
      },
      {
        path: "dashboard",                                                                                // נתיב לדשבורד המשתמש
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת הדשבורד
          import("./features/dashboard/dashboard.component")                                              // טוען את קובץ הדשבורד
            .then((m) => m.DashboardComponent),                                                           // מחזיר את DashboardComponent
      },
      {
        path: "chat",                                                                                     // נתיב למסך הדגמת הצאט
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת הצאט
          import("./features/chat/chat.component")                                                        // טוען את קובץ הצאט
            .then((m) => m.ChatComponent),                                                                // מחזיר את ChatComponent
      },
      {
        path: "profile",                                                                                  // נתיב לעמוד הפרופיל של המשתמש
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת הפרופיל
          import("./features/settings/profile/profile.component")                                         // טוען את קובץ הפרופיל
            .then((m) => m.ProfileComponent),                                                             // מחזיר את ProfileComponent
      },
      {
        path: "billing",                                                                                  // נתיב לעמוד החיוב והתשלום
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת החיוב
          import("./features/settings/billing/billing.component")                                         // טוען את קובץ החיוב
            .then((m) => m.BillingComponent),                                                             // מחזיר את BillingComponent
      },
    ],
  },

  {
    path: "admin",                                                                                        // בסיס אזור האדמין
    canActivate: [authGuard, adminGuard],                                                                 // חייב להיות מחובר וגם אדמין
    loadComponent: () =>                                                                                  // טעינה עצלה של אותו layout של האפליקציה
      import("./shared/ui/app-layout/app-layout.component")                                               // טוען את קובץ ה layout
        .then((m) => m.AppLayoutComponent),                                                               // מחזיר את AppLayoutComponent
    children: [                                                                                           // ילדים של אזור האדמין
      {
        path: "",                                                                                         // נתיב ריק בתוך /admin
        redirectTo: "overview",                                                                           // מפנה ל overview כברירת מחדל
        pathMatch: "full",                                                                                // הפניה מופעלת רק אם הנתיב ריק
      },
      {
        path: "overview",                                                                                 // נתיב לדשבורד האדמין
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת overview
          import("./features/admin/overview/overview.component")                                          // טוען את קובץ overview
            .then((m) => m.OverviewComponent),                                                            // מחזיר את OverviewComponent
      },
      {
        path: "users",                                                                                    // נתיב לניהול משתמשים
        loadComponent: () =>                                                                              // טעינה עצלה של קומפוננטת users
          import("./features/admin/users/users.component")                                                // טוען את קובץ users
            .then((m) => m.UsersComponent),                                                               // מחזיר את UsersComponent
      },
    ],
  },

  {
    path: "**",                                                                                           // כל נתיב שלא זוהה
    redirectTo: "",                                                                                       // מפנה לדף הבית הציבורי
  },
];
