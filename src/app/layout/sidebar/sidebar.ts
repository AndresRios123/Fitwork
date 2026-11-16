import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Forma de cada opción del menú.
interface ItemMenu {
  ruta: string;  // URL a la que lleva
  texto: string; // Texto visible
  icono: string; // Clase del icono de Phosphor
}

// Menú lateral con el logo, las opciones de navegación y la tarjeta inferior.
@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  // Lo recibe del Shell: true = sidebar visible en móvil.
  readonly abierto = input(false);
  // Avisa al Shell que debe cerrarse (al hacer clic en un ítem).
  readonly cerrar = output<void>();

  // Opciones del menú. Para agregar una nueva, basta con añadirla aquí
  // (y su ruta en app.routes.ts). Iconos: phosphoricons.com
  protected readonly items: ItemMenu[] = [
    { ruta: '/panel', texto: 'Panel principal', icono: 'ph-squares-four' },
    { ruta: '/entrenamientos', texto: 'Entrenamientos', icono: 'ph-barbell' },
    { ruta: '/ejercicios', texto: 'Ejercicios', icono: 'ph-list-bullets' },
    { ruta: '/progreso', texto: 'Progreso', icono: 'ph-chart-line' },
    { ruta: '/cardio', texto: 'Cardio', icono: 'ph-heart' },
    { ruta: '/records', texto: 'Récords personales', icono: 'ph-trophy' },
    { ruta: '/objetivos', texto: 'Objetivos', icono: 'ph-target' },
    { ruta: '/perfil', texto: 'Perfil', icono: 'ph-user' },
    { ruta: '/configuracion', texto: 'Configuración', icono: 'ph-gear-six' },
    { ruta: '/ayuda', texto: 'Ayuda y soporte', icono: 'ph-question' },
  ];
}
