import { TestBed } from '@angular/core/testing';

import { MoviesApiService } from './movie-api.service';

describe('MovieService', () => {
  let service: MoviesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoviesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
