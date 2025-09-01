import { TestBed } from '@angular/core/testing';

import { WatchlistApiService } from './watchlist-api.service';

describe('WatchlistApiService', () => {
  let service: WatchlistApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchlistApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
