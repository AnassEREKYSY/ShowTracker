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
import { RegisterRequestDto } from '../../core/dtos/auth.dto';


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['../../features/auth/styles/auth-shell.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStateService);
  private router = inject(Router);

  hide = true; hide2 = true;
  loading = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  });

  get passwordMismatch() {
    const { password, confirm } = this.form.getRawValue();
    return !!password && !!confirm && password !== confirm;
  }

  submit() {
    if (this.form.invalid || this.passwordMismatch || this.loading) return;
    this.loading = true; this.error = null;

    const { email, password } = this.form.getRawValue();
    const dto: RegisterRequestDto = { email, password };

    this.auth.register$(dto).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = (err.error?.message as string) || 'Registration failed. Please try again.';
      },
    });
  }
}
