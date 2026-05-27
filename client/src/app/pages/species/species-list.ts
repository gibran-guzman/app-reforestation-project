import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpeciesService } from '../../services/species.service';
import { AuthService } from '../../services/auth.service';
import type { Species } from '../../models';

@Component({
  selector: 'app-species-list',
  imports: [RouterLink],
  templateUrl: './species-list.html',
})
export default class SpeciesList implements OnInit {
  private service = inject(SpeciesService);
  protected auth = inject(AuthService);

  species: Species[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.service.list().subscribe({
      next: (res) => { this.species = res.data; this.loading = false; },
      error: (err) => { this.error = err.error?.error || 'Error al cargar especies'; this.loading = false; },
    });
  }

  deleteSpecies(id: number) {
    if (!confirm('¿Eliminar esta especie?')) return;
    this.service.remove(id).subscribe({
      next: () => { this.species = this.species.filter((s) => s.id !== id); },
      error: (err) => alert(err.error?.error || 'Error al eliminar'),
    });
  }
}
