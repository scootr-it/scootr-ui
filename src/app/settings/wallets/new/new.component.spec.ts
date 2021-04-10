import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewWalletComponent } from './new.component';

describe('NewWalletComponent', () => {
  let component: NewWalletComponent;
  let fixture: ComponentFixture<NewWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});