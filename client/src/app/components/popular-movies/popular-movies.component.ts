import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MoviesService } from '../../core/services/client-layer/movie.service';

@Component({
  selector: 'app-popular-movies',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MovieCardComponent
  ],
  templateUrl: './popular-movies.component.html',
  styleUrls: ['./popular-movies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopularMoviesComponent {
  readonly pageSize = 20;

  private page$ = this.route.queryParamMap.pipe(
    map(pm => Number(pm.get('page') ?? 1)),
    map(p => (Number.isNaN(p) || p < 1 ? 1 : p)),
    distinctUntilChanged()
  );

  private refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = combineLatest([this.page$, this.refresh$.pipe(startWith(undefined))]).pipe(
    switchMap(([page]) => this.movies.getPopular$(page)),
    map(p => ({
      ...p,
      totalResults: p.totalResults ?? ((p.totalPages ?? 0) * this.pageSize)
    })),
    shareReplay(1)
  );

  constructor(
    private movies: MoviesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  trackById = (_: number, m: any) => m?.id;

  onPage(e: PageEvent) {
    const nextPage = e.pageIndex + 1; // MatPaginator is 0-based
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: nextPage },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
