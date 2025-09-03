import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, of, switchMap, tap, catchError } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { AuthStateService } from '../../core/services/client-layer/auth-state.service';
import { FavoritesService } from '../../core/services/client-layer/favorites.service';
import { WatchlistService } from '../../core/services/client-layer/watchlist.service';
import { MovieSummary } from '../../core/models/movie.models';
import { MoviesService } from '../../core/services/client-layer/movie.service';
import { MediaType } from '../../core/types/media.types';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatToolbarModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatMenuModule,
    MatBadgeModule, MatDividerModule, MatProgressSpinnerModule,
    OverlayModule
  ],
})
export class NavbarComponent {
  @Output() menu = new EventEmitter<void>();
  @Input() avatarUrl?: string;

  private router = inject(Router);
  auth = inject(AuthStateService);
  private movies = inject(MoviesService);
  private favorites = inject(FavoritesService);
  private watchlist = inject(WatchlistService);

  search = new FormControl<string>('');
  open = false;
  isLoading = false;
  results: MovieSummary[] = [];
  readonly type: MediaType = 'movie';
  favSet = new Set<number>();
  watchSet = new Set<number>();

  positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  ];

  constructor() {
    this.favorites.list$(this.type).pipe(takeUntilDestroyed()).subscribe(items => {
      this.favSet = new Set((items ?? []).map(i => i.tmdbId));
    });
    this.watchlist.list$(this.type).pipe(takeUntilDestroyed()).subscribe(items => {
      this.watchSet = new Set((items ?? []).map(i => i.tmdbId));
    });

    this.search.valueChanges.pipe(
      takeUntilDestroyed(),
      map(v => (v ?? '').trim()),
      tap(q => this.open = q.length > 0),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.isLoading = false;
          this.results = [];
          return of(null);
        }
        this.isLoading = true;
        return this.movies.search$(q, 1).pipe(
          catchError(() => of({ results: [], totalPages: 0 } as any))
        );
      })
    ).subscribe(paged => {
      this.isLoading = false;
      if (paged) this.results = paged.results ?? [];
    });
  }

  submit() {
    const q = (this.search.value || '').trim();
    this.open = q.length > 0;
  }

  logout() {
    this.auth.logout$().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }

  get userLetter(): string {
    const email = this.auth.user?.email ?? '';
    return email ? email[0].toUpperCase() : 'U';
  }

  goToDetails(id: number) {
    this.open = false;
    this.router.navigate(['/movies', id]);
  }

  toggleFavorite(id: number, isFav: boolean, evt: Event) {
    evt.stopPropagation();
    const op$ = isFav ? this.favorites.remove$(this.type, id) : this.favorites.add$(this.type, id);
    op$.subscribe({ next: () => { if (isFav) this.favSet.delete(id); else this.favSet.add(id); } });
  }

  toggleWatchlist(id: number, inWatch: boolean, evt: Event) {
    evt.stopPropagation();
    const op$ = inWatch ? this.watchlist.remove$(this.type, id) : this.watchlist.add$(this.type, id);
    op$.subscribe({ next: () => { if (inWatch) this.watchSet.delete(id); else this.watchSet.add(id); } });
  }

  closePanel() {
    this.open = false;
  }

  trackById = (_: number, item: { id: number }) => item.id;
}
