import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchlistMoviesComponent } from './watchlist-movies.component';

describe('WatchlistMoviesComponent', () => {
  let component: WatchlistMoviesComponent;
  let fixture: ComponentFixture<WatchlistMoviesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistMoviesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WatchlistMoviesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
