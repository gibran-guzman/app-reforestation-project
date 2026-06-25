import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.auth.initialize();

    effect(() => {
      if (this.auth.isAuthenticated() && this.router.url === '/login') {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }
}
