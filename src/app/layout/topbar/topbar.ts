import { Component, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

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

  // Datos de ejemplo: más adelante vendrán del usuario que inició sesión
  protected readonly usuario = { nombre: 'Alex Pérez', nivel: 'Nivel intermedio' };
  // "Alex Pérez" -> "AP" (se muestra en el avatar)
  protected readonly iniciales = this.usuario.nombre
    .split(' ')
    .map(palabra => palabra[0])
    .join('');

  // Indica si el desplegable del usuario está abierto.
  protected readonly menuUsuarioAbierto = signal(false);

  // Cada vez que cambia la página, lee el "titulo" que pusimos en app.routes.ts
  protected readonly paginaActual = toSignal(
    this.router.events.pipe(
      filter(evento => evento instanceof NavigationEnd),
      map(() => this.leerTitulo()),
    ),
    { initialValue: '' },
  );

  protected alternarMenuUsuario() {
    this.menuUsuarioAbierto.update(abierto => !abierto);
  }

  protected cerrarMenuUsuario() {
    this.menuUsuarioAbierto.set(false);
  }

  protected cerrarSesion() {
    this.cerrarMenuUsuario();
    // Se implementa en la fase de autenticación
    console.log('Cerrar sesión');
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