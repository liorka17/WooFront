import { TestBed } from '@angular/core/testing';// ייבוא TestBed

import { MeapiService } from './meapi.service';// שירות Meapi

describe('MeapiService', () => {// תיאור קבוצת בדיקות
  let service: MeapiService;// משתנה שירות

  beforeEach(() => {
    TestBed.configureTestingModule({});// הגדרת מודול בדיקה
    service = TestBed.inject(MeapiService);// הזרקת שירות
  });

  it('should be created', () => {// בדיקה שהשירות נוצר
    expect(service).toBeTruthy();// ציפייה שהשירות קיים
  });
});
