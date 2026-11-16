import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

// Marco principal de la app: junta el sidebar, el topbar y la página actual.
@Component({
  imports: [RouterOutlet, Sidebar, Topbar],
  selector: 'app-shell',
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {
  // Indica si el sidebar está abierto en pantallas pequeñas (menú hamburguesa).
  protected readonly menuAbierto = signal(false);

  // Abre o cierra el sidebar (lo llama el botón hamburguesa del topbar).
  protected alternarMenu() {
    this.menuAbierto.update(abierto => !abierto);
  }

  // Cierra el sidebar (al elegir un ítem o tocar el fondo oscuro).
  protected cerrarMenu() {
    this.menuAbierto.set(false);
  }
}