import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, fromEvent } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { WatchlistService } from '../../core/services/client-layer/watchlist.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';

@Component({
  selector: 'app-watchlist-movies',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatProgressSpinnerModule, MovieCardComponent],
  templateUrl: './watchlist-movies.component.html',
  styleUrls: ['./watchlist-movies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistMoviesComponent implements OnDestroy {
  readonly pageSize = 20;
  private destroy$ = new Subject<void>();
  private page$ = this.route.queryParamMap.pipe(
    map(pm => Number(pm.get('page') ?? 1)),
    map(p => (Number.isNaN(p) || p < 1 ? 1 : p)),
    distinctUntilChanged()
  );

  private changed$ = fromEvent<CustomEvent>(document, 'watchlist:changed').pipe(startWith(null));
  private refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = combineLatest([this.page$, this.changed$, this.refresh$]).pipe(
    switchMap(([page]) =>
      this.watch.listHydrated$('movie').pipe(
        map(resp => ({ page, items: resp.items ?? [] as any[] }))
      )
    ),
    map(({ page, items }) => {
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * this.pageSize;
      const pageItems = items.slice(start, start + this.pageSize);

      return {
        items: pageItems,
        page: safePage,
        totalResults: total,
        totalPages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private watch: WatchlistService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  onPage(e: PageEvent) {
    const next = e.pageIndex + 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: next },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  trackById = (_: number, m: any) => m?.id;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
