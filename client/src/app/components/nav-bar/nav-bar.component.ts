import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthStateService } from '../../core/services/client-layer/auth-state.service';


@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatToolbarModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatMenuModule,
    MatBadgeModule, MatDividerModule
  ],
})
export class NavbarComponent {
  @Output() menu = new EventEmitter<void>();
  @Input() avatarUrl?: string;

  private router = inject(Router);
  auth = inject(AuthStateService);

  search = new FormControl('');

  submit() {
    const q = (this.search.value || '').trim();
    if (!q) return;
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  logout() {
    this.auth.logout$().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }

  get userLetter(): string {
    const email = this.auth.user?.email ?? '';
    return email ? email[0].toUpperCase() : 'U';
  }
}
