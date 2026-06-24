import { Injectable, inject, signal, DestroyRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly destroyRef = inject(DestroyRef);
  readonly online = signal(navigator.onLine);

  constructor() {
    const onOnline = () => this.online.set(true);
    const onOffline = () => this.online.set(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  }
}
