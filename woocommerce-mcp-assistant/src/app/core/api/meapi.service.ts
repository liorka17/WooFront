import { Injectable } from "@angular/core";                                                // דקורטור שירות
import { HttpClient } from "@angular/common/http";                                         // http client
import { environment } from "../../../environments/environment";                           // apiBase

export type UpdateWooPayload = {                                                           // טיפוס גוף עדכון
  woo_url: string;                                                                          // כתובת חנות
  woo_ck: string;                                                                           // consumer key
  woo_cs: string;                                                                           // consumer secret
  store_name?: string;                                                                      // שם חנות אופציונלי
};                                                                                          // סוף טיפוס

@Injectable({ providedIn: "root" })                                                         // שירות גלובלי
export class MeapiService {                                                                 // מחלקת שירות
  private apiBase = environment.apiBase;                                                    // apiBase בדרך כלל api

  constructor(private http: HttpClient) {}                                                  // הזרקת http

  updateWoo(body: UpdateWooPayload) {                                                       // עדכון פרטי חנות
    return this.http.put<any>(`${this.apiBase}/me/woo`, body);                               // קורא ל api me woo
  }                                                                                         // סוף updateWoo

  generateClientKey() {                                                                     // יצירת client key
    const dash = String.fromCharCode(45);                                                   // יוצר תו מפריד בלי לכתוב אותו
    const path = `/me/client${dash}key`;                                                     // בונה נתיב me client key
    return this.http.post<any>(`${this.apiBase}${path}`, {});                               // קורא ל api ומחזיר תוצאה
  }                                                                                         // סוף generateClientKey
}                                                                                           // סוף class
