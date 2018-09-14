import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErdeditorComponent } from './erdeditor.component';

describe('ErdeditorComponent', () => {
  let component: ErdeditorComponent;
  let fixture: ComponentFixture<ErdeditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErdeditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErdeditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
