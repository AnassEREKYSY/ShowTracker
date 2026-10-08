import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImgPipe } from '../core/format';
import { IconComponent } from './icon.component';

export interface PosterItem {
  id: number;
  type: 'movie' | 'tv' | 'person';
  title: string | null;
  year?: number | null;
  posterPath: string | null;
  rating?: number | null;
  subtitle?: string | null;
}

@Component({
  selector: 'app-poster-card',
  standalone: true,
  imports: [RouterLink, ImgPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <a [routerLink]="link()" class="group block focus-visible:outline-none" [attr.aria-label]="item().title">
      <div class="poster ring-1 ring-inset ring-line/[0.06] transition duration-200 group-hover:ring-line/25 group-focus-visible:ring-2 group-focus-visible:ring-accent"
           [class.rounded-full]="round()" [class.!aspect-square]="round()">
        @if (item().posterPath; as p) {
          <img [src]="p | img: 'w342'" [alt]="''" loading="lazy" decoding="async"
               class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        } @else {
          <div class="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-ink-faint">
            <app-icon [name]="item().type === 'person' ? 'user' : item().type === 'tv' ? 'tv' : 'film'" [size]="22" />
            <span class="line-clamp-3 text-xs">{{ item().title }}</span>
          </div>
        }
        @if (badge()) {
          <span class="absolute left-2 top-2 rounded-md bg-bg/85 px-1.5 py-0.5 text-2xs font-semibold text-ink backdrop-blur">{{ badge() }}</span>
        }
        @if (progress() !== null) {
          <div class="absolute inset-x-0 bottom-0 h-1 bg-bg/70">
            <div class="h-full bg-accent" [style.width.%]="(progress() ?? 0) * 100"></div>
          </div>
        }
      </div>
      @if (!hideMeta()) {
        <div class="mt-2 px-0.5">
          <p class="line-clamp-1 text-sm font-medium text-ink/95 group-hover:text-ink" [class.text-center]="round()">{{ item().title }}</p>
          <p class="mt-0.5 flex items-center gap-2 text-[13px] text-ink-faint" [class.justify-center]="round()">
            @if (subtitle()) { <span class="line-clamp-1">{{ subtitle() }}</span> }
            @else {
              @if (item().year) { <span>{{ item().year }}</span> }
              @if (item().rating) {
                <span class="inline-flex items-center gap-1"><app-icon name="star" [size]="12" [fill]="true" class="text-accent/80" />{{ item().rating }}</span>
              }
            }
          </p>
        </div>
      }
    </a>
  `,
})
export class PosterCardComponent {
  item = input.required<PosterItem>();
  subtitle = input<string | null>(null);
  badge = input<string | null>(null);
  progress = input<number | null>(null);
  hideMeta = input(false);
  link = computed(() => ['/', this.item().type, this.item().id]);
  round = computed(() => this.item().type === 'person');
}
