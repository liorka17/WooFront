import { Routes } from '@angular/router';

export const routes: Routes = [
  // --- אתר ציבורי (Public Site) ---
  {
    path: '',
    loadComponent: () => import('./shared/ui/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) 
      },
      { 
        path: 'pricing', 
        loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) 
      },
      { 
        path: 'login', 
        loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent) 
      },
      { 
        path: 'register', 
        loadComponent: () => import('./core/auth/register/register.component').then(m => m.RegisterComponent) 
      }
    ]
  },

  // --- אפליקציה פנימית ללקוחות (User Dashboard) ---
  {
    path: 'app',
    loadComponent: () => import('./shared/ui/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'chat', 
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./features/settings/profile/profile.component').then(m => m.ProfileComponent) 
      },
      { 
        path: 'billing', 
        loadComponent: () => import('./features/settings/billing/billing.component').then(m => m.BillingComponent) 
      }
    ]
  },

  // --- ממשק אדמין (Admin) ---
  {
    path: 'admin',
    loadComponent: () => import('./shared/ui/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      { 
        path: 'overview', 
        loadComponent: () => import('./features/admin/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent) 
      }
    ]
  },

  { path: '**', redirectTo: '' }
];