import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Five stars with half steps. Value is 1..10 (2 = one star). Click the current value again to clear it.
 */
@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <div class="relative inline-flex" role="slider" [attr.aria-label]="label()" aria-valuemin="0" aria-valuemax="10"
         [attr.aria-valuenow]="value() ?? 0" [attr.aria-valuetext]="text()" [attr.tabindex]="readonly() ? -1 : 0"
         (keydown)="key($event)" (mouseleave)="hover.set(null)">
      @for (i of stars; track i) {
        <span class="relative inline-flex" [class.cursor-pointer]="!readonly()" [style.padding.px]="readonly() ? 0 : 2">
          <app-icon name="star" [size]="size()" [stroke]="1.5" class="text-ink-faint/60" />
          <span class="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" [style.padding.px]="readonly() ? 0 : 2"
                [style.width]="fillWidth(i)">
            <app-icon name="star" [size]="size()" [stroke]="1.5" [fill]="true" class="text-accent" />
          </span>
          @if (!readonly()) {
            <button type="button" tabindex="-1" class="absolute inset-y-0 left-0 w-1/2" [attr.aria-label]="(i * 2 - 1) / 2 + ' stars'"
                    (mouseenter)="hover.set(i * 2 - 1)" (click)="pick(i * 2 - 1)"></button>
            <button type="button" tabindex="-1" class="absolute inset-y-0 right-0 w-1/2" [attr.aria-label]="i + ' stars'"
                    (mouseenter)="hover.set(i * 2)" (click)="pick(i * 2)"></button>
          }
        </span>
      }
    </div>
    @if (showValue()) { <span class="min-w-[2.5rem] text-sm tabular-nums text-ink-muted">{{ text() }}</span> }
  `,
})
export class RatingComponent {
  value = input<number | null>(null);
  readonly = input(false);
  size = input(20);
  showValue = input(false);
  label = input('Your rating');
  changed = output<number | null>();
  hover = signal<number | null>(null);
  stars = [1, 2, 3, 4, 5];
  shown = computed(() => this.hover() ?? this.value() ?? 0);
  text = computed(() => (this.shown() ? `${this.shown() / 2} / 5` : 'Not rated'));

  fillWidth(i: number) {
    const v = this.shown();
    return v >= i * 2 ? '100%' : v === i * 2 - 1 ? '50%' : '0%';
  }
  pick(v: number) {
    if (this.readonly()) return;
    this.changed.emit(v === this.value() ? null : v);
  }
  key(e: KeyboardEvent) {
    if (this.readonly()) return;
    const v = this.value() ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); this.changed.emit(Math.min(10, v + 1)); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); this.changed.emit(v > 1 ? v - 1 : null); }
  }
}
