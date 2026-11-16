import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

// Barra superior: hamburguesa (móvil), breadcrumb, notificaciones y menú del usuario.
@Component({
  imports: [RouterLink],
  selector: 'app-topbar',
  styleUrl: './topbar.scss',
  templateUrl: './topbar.html',
})
export class Topbar {
  // Avisa al Shell que se tocó el botón hamburguesa.
  readonly abrirMenu = output<void>();

  // Router de Angular: permite saber en qué página estamos.
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  // Usuario que inició sesión (viene del AuthService)
  protected readonly usuario = this.auth.currentUser;

  // "Alex Pérez" -> "AP" (se muestra en el avatar)
  protected readonly iniciales = computed(() =>
    (this.usuario()?.nombre ?? '')
      .split(' ')
      .filter(palabra => palabra)
      .slice(0, 2)
      .map(palabra => palabra[0].toUpperCase())
      .join(''),
  );

  // Indica si el desplegable del usuario está abierto.
  protected readonly menuUsuarioAbierto = signal(false);

  // Cada vez que cambia la página, lee el "titulo" que pusimos en app.routes.ts
  protected readonly paginaActual = toSignal(
    this.router.events.pipe(
      filter(evento => evento instanceof NavigationEnd),
      map(() => this.leerTitulo()),
    ),
    { initialValue: this.leerTitulo() },
  );

  protected alternarMenuUsuario() {
    this.menuUsuarioAbierto.update(abierto => !abierto);
  }

  protected cerrarMenuUsuario() {
    this.menuUsuarioAbierto.set(false);
  }

  protected cerrarSesion() {
    this.cerrarMenuUsuario();
    this.auth.logout();
  }

  // Baja hasta la ruta más interna (la página actual) y devuelve su "titulo".
  private leerTitulo(): string {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    return ruta.data['titulo'] ?? '';
  }
}