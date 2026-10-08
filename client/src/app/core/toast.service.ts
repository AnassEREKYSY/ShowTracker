import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; tone: 'info' | 'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private n = 0;

  show(text: string, tone: Toast['tone'] = 'info') {
    const id = ++this.n;
    this.toasts.update(t => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => this.dismiss(id), 3200);
  }
  error(text = 'Something went wrong. Please try again.') { this.show(text, 'error'); }
  dismiss(id: number) { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
