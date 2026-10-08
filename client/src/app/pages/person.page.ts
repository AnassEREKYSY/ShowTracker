import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { ImgPipe } from '../core/format';
import { Person } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { MediaRowComponent } from '../shared/media-row.component';

@Component({
  selector: 'app-person',
  standalone: true,
  imports: [RouterLink, ImgPipe, IconComponent, MediaRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (p(); as p) {
      <div class="page pt-8 sm:pt-12">
        <div class="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
          <div class="mx-auto w-40 md:mx-0 md:w-full">
            <div class="poster ring-1 ring-line/[0.08]">
              @if (p.profilePath) { <img [src]="p.profilePath | img: 'h632'" [alt]="p.name" class="h-full w-full object-cover" /> }
              @else { <div class="flex h-full items-center justify-center text-ink-faint"><app-icon name="user" [size]="40" /></div> }
            </div>
          </div>
          <div class="min-w-0">
            @if (p.department) { <p class="eyebrow">{{ p.department }}</p> }
            <h1 class="h1 mt-2">{{ p.name }}</h1>
            <p class="mt-2 text-sm text-ink-muted">
              @if (p.birthday) { Born {{ date(p.birthday) }}@if (age(p)) { ({{ age(p) }}) } }
              @if (p.placeOfBirth) { · {{ p.placeOfBirth }} }
              @if (p.deathday) { · Died {{ date(p.deathday) }} }
            </p>
            @if (p.biography) {
              <p class="mt-5 max-w-3xl whitespace-pre-line text-[15px] leading-7 text-ink/85" [class.line-clamp-6]="!fullBio()">{{ p.biography }}</p>
              @if (p.biography.length > 500) {
                <button type="button" class="btn-ghost btn-sm mt-2 -ml-3" (click)="fullBio.set(!fullBio())">{{ fullBio() ? 'Show less' : 'Read more' }}</button>
              }
            }
          </div>
        </div>

        @if (p.knownFor.length) {
          <app-media-row class="mt-12" title="Known for" [items]="p.knownFor" />
        }

        <section class="mt-12">
          <div class="mb-3 flex items-end justify-between">
            <h2 class="h2">Filmography</h2>
            <div class="flex gap-2">
              @for (f of filters; track f.v) {
                <button type="button" class="chip" [class.chip-on]="filter() === f.v" (click)="filter.set(f.v)">{{ f.label }}</button>
              }
            </div>
          </div>
          <ul class="divide-y divide-line/[0.06] overflow-hidden rounded-card border border-line/[0.08]">
            @for (c of credits(); track c.type + c.id) {
              <li>
                <a [routerLink]="['/', c.type, c.id]" class="flex items-center gap-4 bg-surface px-4 py-3 transition-colors hover:bg-raised">
                  <span class="w-12 shrink-0 text-sm tabular-nums text-ink-faint">{{ c.year ?? '—' }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium">{{ c.title }}</span>
                    @if (c.character) { <span class="block truncate text-[13px] text-ink-muted">as {{ c.character }}</span> }
                  </span>
                  <span class="tag shrink-0">{{ c.type === 'tv' ? 'Series' : 'Film' }}</span>
                </a>
              </li>
            }
          </ul>
        </section>
      </div>
    } @else if (error()) {
      <div class="page py-24 text-center"><p class="h2">Person not found</p></div>
    } @else {
      <div class="page pt-12"><div class="grid gap-12 md:grid-cols-[220px_1fr]"><div class="skeleton aspect-[2/3]"></div><div class="space-y-4"><div class="skeleton h-10 w-1/2"></div><div class="skeleton h-32"></div></div></div></div>
    }
  `,
})
export class PersonPage {
  id = input.required<string>();
  private api = inject(Api);
  private title = inject(Title);
  p = signal<Person | null>(null);
  error = signal(false);
  fullBio = signal(false);
  filter = signal<'all' | 'movie' | 'tv'>('all');
  filters = [{ v: 'all' as const, label: 'All' }, { v: 'movie' as const, label: 'Films' }, { v: 'tv' as const, label: 'Series' }];
  credits = computed(() => (this.p()?.filmography ?? []).filter(c => this.filter() === 'all' || c.type === this.filter()));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        this.p.set(null); this.error.set(false);
        this.api.person(id).subscribe({
          next: p => { this.p.set(p); this.title.setTitle(`${p.name} · ShowTracker`); },
          error: () => this.error.set(true),
        });
      });
    });
  }

  date(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  age(p: Person) {
    if (!p.birthday || p.deathday) return null;
    const b = new Date(p.birthday), now = new Date();
    return now.getFullYear() - b.getFullYear() - (now < new Date(now.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  }
}
