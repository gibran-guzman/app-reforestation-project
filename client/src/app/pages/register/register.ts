import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { extractErrorMessage } from '../../helpers/api-error';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly email = signal('');
  readonly password = signal('');
  readonly full_name = signal('');
  readonly role = signal<'technician' | 'admin'>('technician');
  readonly error = signal('');
  readonly success = signal('');
  readonly loading = signal(false);

  submit() {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    this.auth.signup({
      email: this.email(),
      password: this.password(),
      full_name: this.full_name(),
      role: this.role(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.success.set('Usuario creado correctamente.');
        this.email.set('');
        this.password.set('');
        this.full_name.set('');
        this.role.set('technician');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al crear usuario'));
        this.loading.set(false);
      },
    });
  }
}
