import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export default class Dashboard implements OnInit {
  protected auth = inject(AuthService);
  private router = inject(Router);
  successMsg = '';

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.successMsg = (nav?.extras?.state as Record<string, string>)?.['success'] || '';
  }
}
