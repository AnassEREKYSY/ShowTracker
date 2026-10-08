import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { PosterCardComponent, PosterItem } from './poster-card.component';

/** Horizontal row of posters with a title and optional "See all" link. */
@Component({
  selector: 'app-media-row',
  standalone: true,
  imports: [RouterLink, IconComponent, PosterCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 class="h2">{{ title() }}</h2>
        @if (hint()) { <p class="mt-0.5 text-[13px] text-ink-faint">{{ hint() }}</p> }
      </div>
      <div class="flex items-center gap-1">
        @if (moreLink()) {
          <a [routerLink]="moreLink()" [queryParams]="moreParams()" class="btn-ghost btn-sm">See all</a>
        }
        <button type="button" class="btn-ghost btn-sm hidden w-8 px-0 sm:inline-flex" (click)="scroll(-1)" aria-label="Scroll left"><app-icon name="chevron-left" /></button>
        <button type="button" class="btn-ghost btn-sm hidden w-8 px-0 sm:inline-flex" (click)="scroll(1)" aria-label="Scroll right"><app-icon name="chevron-right" /></button>
      </div>
    </div>
    <div #track class="scroller -mx-4 scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
      @if (loading()) {
        @for (i of skeletons; track i) {
          <div class="w-[132px] shrink-0 sm:w-[158px]"><div class="skeleton aspect-[2/3]"></div><div class="skeleton mt-2 h-3.5 w-3/4"></div></div>
        }
      } @else {
        @for (item of items(); track item.type + item.id) {
          <app-poster-card class="shrink-0 snap-start" [class]="item.type === 'person' ? 'w-[96px] sm:w-[112px]' : 'w-[132px] sm:w-[158px]'" [item]="item" [subtitle]="item.subtitle ?? null" />
        }
      }
    </div>
  `,
})
export class MediaRowComponent {
  title = input.required<string>();
  hint = input<string | null>(null);
  items = input<PosterItem[]>([]);
  loading = input(false);
  moreLink = input<string | null>(null);
  moreParams = input<Record<string, string> | null>(null);
  skeletons = Array.from({ length: 8 }, (_, i) => i);
  private track = viewChild<ElementRef<HTMLElement>>('track');

  scroll(dir: 1 | -1) {
    const el = this.track()?.nativeElement;
    el?.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  }
}
