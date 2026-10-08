import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PosterCardComponent, PosterItem } from './poster-card.component';

@Component({
  selector: 'app-poster-grid',
  standalone: true,
  imports: [PosterCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      @for (item of items(); track item.type + item.id) {
        <app-poster-card [item]="item" />
      }
      @if (loading()) {
        @for (i of skeletons; track i) {
          <div><div class="skeleton aspect-[2/3]"></div><div class="skeleton mt-2 h-3.5 w-3/4"></div></div>
        }
      }
    </div>
  `,
})
export class PosterGridComponent {
  items = input<PosterItem[]>([]);
  loading = input(false);
  skeletons = Array.from({ length: 12 }, (_, i) => i);
}
