import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-trailer-dialog',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" (click)="closed.emit()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <div class="w-full max-w-5xl" (click)="$event.stopPropagation()">
        <div class="mb-3 flex items-center justify-between gap-4">
          <p class="line-clamp-1 text-sm text-ink-muted">{{ title() }}</p>
          <button type="button" class="btn-ghost btn-icon" (click)="closed.emit()" aria-label="Close"><app-icon name="x" /></button>
        </div>
        <div class="aspect-video overflow-hidden rounded-card bg-black">
          <iframe class="h-full w-full" [src]="src()" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  `,
})
export class TrailerDialogComponent {
  videoKey = input.required<string>();
  title = input('Trailer');
  closed = output<void>();
  private s = inject(DomSanitizer);
  // YouTube keys come from TMDB; only [A-Za-z0-9_-] is kept before building the URL.
  src = computed(() => this.s.bypassSecurityTrustResourceUrl(
    `https://www.youtube-nocookie.com/embed/${this.videoKey().replace(/[^\w-]/g, '')}?autoplay=1&rel=0`));

  @HostListener('document:keydown.escape') esc() { this.closed.emit(); }
}
