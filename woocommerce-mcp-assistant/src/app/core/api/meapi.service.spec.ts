import { TestBed } from '@angular/core/testing';

import { MeapiService } from './meapi.service';

describe('MeapiService', () => {
  let service: MeapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
