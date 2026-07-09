import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeDropdown()',
  },
})
export class Navbar {
  protected auth = inject(AuthService);
  protected connectivity = inject(ConnectivityService);
  protected offline = inject(OfflineService);
  readonly collapsed = signal(true);
  readonly dropdownOpen = signal(false);

  readonly ROLE_LABELS: Record<string, string> = { admin: 'Administrador', technician: 'Técnico' };
  readonly roleLabel = computed(() => this.ROLE_LABELS[this.auth.user()?.role ?? ''] || this.auth.user()?.role || '—');

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  toggleDropdown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  onDropdownKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.dropdownOpen.update(v => !v);
    }
  }

  closeNav() {
    this.collapsed.set(true);
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }
}
