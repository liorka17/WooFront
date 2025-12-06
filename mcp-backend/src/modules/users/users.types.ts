// גוף בקשת הרשמה
export interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  role: "owner" | "agency" | "developer";
  storeUrl: string;
  plan: "starter" | "pro";
}

// גוף עדכון משתמש
export interface UpdateUserBody {
  fullName: string;
  role: "owner" | "agency" | "developer";
  storeUrl: string;
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
  plan: string;
  isEmailVerified: boolean;
  createdAt: string;
}
