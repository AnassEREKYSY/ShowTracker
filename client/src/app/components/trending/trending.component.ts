import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { TrendingService } from '../../core/services/client-layer/trending.service';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

type TimeWindow = 'day' | 'week';
type CardMovie = { id: number; title?: string; posterPath?: string | null };

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MovieCardComponent
  ],
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendingComponent {
  tw$ = new BehaviorSubject<TimeWindow>('day');
  private limit$ = new BehaviorSubject<number>(20);
  private refresh$ = new Subject<void>();

  items$ = combineLatest([
    this.tw$,
    this.limit$,
    this.refresh$.pipe(startWith(void 0)),
  ]).pipe(
    switchMap(([tw, limit]) =>
      this.trending.get$('movie', tw, limit).pipe(
        catchError(() => of([]))
      )
    ),
    map(items =>
      items.map<CardMovie>(it => ({
        id: it.tmdbId,
        title: it.title ?? undefined,
        posterPath: it.posterPath ?? null,
      }))
    ),
    shareReplay(1)
  );

  constructor(private trending: TrendingService) {}

  setWindow(tw: TimeWindow) {
    if (this.tw$.value !== tw) {
      this.tw$.next(tw);
      this.limit$.next(20); // reset pagination when switching window
    }
  }

  loadMore() {
    const cur = this.limit$.value ?? 20;
    this.limit$.next(Math.min(50, cur + 20)); // server caps at 50
  }

  syncNow() {
    const tw = this.tw$.value;
    this.trending.adminSync$('movie', tw).subscribe({
      next: () => this.refresh$.next(),
      error: () => this.refresh$.next(),
    });
  }

  trackById = (_: number, m: { id: number }) => m.id;
}
