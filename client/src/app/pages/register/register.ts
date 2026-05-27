import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export default class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  full_name = '';
  error = '';
  success = '';
  loading = false;

  submit() {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.auth.signup({ email: this.email, password: this.password, full_name: this.full_name }).subscribe({
      next: () => {
        this.success = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al registrarse';
        this.loading = false;
      },
    });
  }
}
