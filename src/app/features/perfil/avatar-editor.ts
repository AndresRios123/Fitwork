import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Presentacional: muestra la foto (o las iniciales) y avisa cuando el usuario
// elige otra imagen o quiere quitarla. No sabe cómo se procesa ni se guarda.
@Component({
  selector: 'app-avatar-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="foto">
      @if (avatar(); as url) {
        <img [src]="url" alt="Foto de perfil" width="112" height="112" />
      } @else {
        <span aria-hidden="true">{{ iniciales() }}</span>
      }
    </div>
    <div class="acciones">
      <label class="boton">
        <i class="ph ph-camera" aria-hidden="true"></i> {{ avatar() ? 'Cambiar foto' : 'Subir foto' }}
        <input type="file" accept="image/*" (change)="elegir($event)" />
      </label>
      @if (avatar()) {
        <button type="button" class="boton secundario" (click)="quitar.emit()">Quitar</button>
      }
    </div>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: .75rem;
    }

    .foto {
      display: grid;
      place-items: center;
      width: 7rem;
      height: 7rem;
      overflow: hidden;
      border: 4px solid var(--color-surface);
      border-radius: 50%;
      background: var(--color-primary);
      box-shadow: var(--shadow-md);
      color: #fff;
      font-size: 2.25rem;
      font-weight: 800;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: .5rem;
    }

    .boton {
      display: inline-flex;
      align-items: center;
      gap: .375rem;
      min-height: 2.5rem;
      padding: .375rem .875rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--gray-900);
      cursor: pointer;
      font: inherit;
      font-size: var(--fs-sm);
      font-weight: 700;
    }

    .boton:hover { border-color: var(--color-primary); }

    .boton:focus-within,
    .boton:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .secundario { color: var(--gray-700); }

    input[type='file'] {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }

    .error {
      margin: 0;
      color: var(--color-danger);
      font-size: .8125rem;
      text-align: center;
    }
  `,
})
export class AvatarEditor {
  readonly avatar = input<string | null>(null);
  readonly iniciales = input('');
  readonly error = input('');
  readonly archivoElegido = output<File>();
  readonly quitar = output<void>();

  protected elegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    if (archivo) {
      this.archivoElegido.emit(archivo);
    }
    campo.value = ''; // permite volver a elegir el mismo archivo
  }
}
