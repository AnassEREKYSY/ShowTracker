import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStateService } from '../../core/services/client-layer/auth-state.service';
import { LoginRequestDto } from '../../core/dtos/auth.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['../../features/auth/styles/auth-shell.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStateService);
  private router = inject(Router);

  hide = true;
  loading = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = null;

    const dto: LoginRequestDto = this.form.getRawValue();
    this.auth.login$(dto).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = (err.error?.message as string) || 'Login failed. Please check your credentials.';
      },
    });
  }
}
