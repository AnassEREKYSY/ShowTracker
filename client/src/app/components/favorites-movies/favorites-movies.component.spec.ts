import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesMoviesComponent } from './favorites-movies.component';

describe('FavoritesMoviesComponent', () => {
  let component: FavoritesMoviesComponent;
  let fixture: ComponentFixture<FavoritesMoviesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritesMoviesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FavoritesMoviesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
