import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center rounded-card border border-dashed border-line/[0.12] px-6 py-14 text-center">
      <span class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-muted"><app-icon [name]="icon()" [size]="20" /></span>
      <p class="font-medium">{{ title() }}</p>
      @if (text()) { <p class="mt-1 max-w-sm text-sm text-ink-muted">{{ text() }}</p> }
      <div class="mt-5 empty:hidden"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('film');
  title = input.required<string>();
  text = input<string | null>(null);
}
