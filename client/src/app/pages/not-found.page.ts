import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page py-28 text-center">
      <p class="eyebrow">404</p>
      <h1 class="h1 mt-3">This page does not exist</h1>
      <p class="mt-2 text-ink-muted">The link may be broken or the page was moved.</p>
      <a routerLink="/" class="btn-secondary mt-8">Back to home</a>
    </div>
  `,
})
export class NotFoundPage {}
