import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ZoneService } from '../../services/zone.service';
import { AuthService } from '../../services/auth.service';
import type { Zone } from '../../models';

@Component({
  selector: 'app-zone-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './zone-list.html',
})
export default class ZoneList implements OnInit {
  private service = inject(ZoneService);
  protected auth = inject(AuthService);

  zones: Zone[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.service.list().subscribe({
      next: (res) => { this.zones = res.data; this.loading = false; },
      error: (err) => { this.error = err.error?.error || 'Error al cargar zonas'; this.loading = false; },
    });
  }

  deleteZone(id: number) {
    if (!confirm('¿Eliminar esta zona?')) return;
    this.service.remove(id).subscribe({
      next: () => { this.zones = this.zones.filter((z) => z.id !== id); },
      error: (err) => alert(err.error?.error || 'Error al eliminar'),
    });
  }
}
