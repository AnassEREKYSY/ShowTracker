import { TestBed } from '@angular/core/testing';

import { FavoritesApiService } from './favorites-api.service';

describe('FavoritesApiService', () => {
  let service: FavoritesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
