import { TestBed } from '@angular/core/testing';

import { TrendingApiService } from './trending-api.service';

describe('TrendingApiService', () => {
  let service: TrendingApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrendingApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
