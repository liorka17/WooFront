import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WookeysComponent } from './wookeys.component';

describe('WookeysComponent', () => {
  let component: WookeysComponent;
  let fixture: ComponentFixture<WookeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WookeysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WookeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
