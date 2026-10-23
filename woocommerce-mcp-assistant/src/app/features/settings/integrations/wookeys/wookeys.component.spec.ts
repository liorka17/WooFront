import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WooKeysComponent } from './wookeys.component';

describe('WookeysComponent', () => {
  let component: WooKeysComponent;
  let fixture: ComponentFixture<WooKeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WooKeysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WooKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
