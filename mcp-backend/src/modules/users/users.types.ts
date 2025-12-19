// גוף בקשת הרשמה
export interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  role: "owner" | "agency" | "developer";
  storeUrl: string;
  storeName: string; // חדש  שם חנות שהמשתמש מזין ברישום
  plan: "starter" | "pro";
}

// גוף עדכון משתמש
export interface UpdateUserBody {
  fullName: string;
  role: "owner" | "agency" | "developer";
  storeUrl: string;
  storeName: string; // חדש  אפשרות לעדכן שם חנות מתוך אדמין
  plan: "starter" | "pro";
  isEmailVerified: boolean;
}

// מה אנחנו מחזירים ללקוח
export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  storeUrl: string;
  storeName: string; // חדש  נשלח ל UI כדי להציג בדשבורד
  plan: string;
  isEmailVerified: boolean;
  createdAt: string;
}
