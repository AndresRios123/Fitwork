import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConCambiosPendientes } from '../../core/guards/cambios-sin-guardar.guard';
import { NIVELES } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ProcesadorImagen } from '../../core/services/procesador-imagen';
import { formatearCantidad } from '../../shared/utils/formato';
import { AvatarEditor } from './avatar-editor';
import { calcularImc } from './imc';

// Contenedor de la página de perfil: carga los datos del usuario en el
// formulario, valida, procesa el avatar y guarda a través de AuthService.
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, AvatarEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './perfil.scss',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit, ConCambiosPendientes {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly imagenes = inject(ProcesadorImagen);

  protected readonly usuario = this.auth.currentUser;
  protected readonly niveles = NIVELES;

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(60)]],
    nivel: ['Principiante', Validators.required],
    pesoKg: this.fb.control<number | null>(null, [Validators.min(20), Validators.max(300)]),
    estaturaCm: this.fb.control<number | null>(null, [Validators.min(100), Validators.max(250)]),
    edad: this.fb.control<number | null>(null, [Validators.min(13), Validators.max(100), Validators.pattern(/^\d+$/)]),
  });

  /** Foto elegida en pantalla (aún sin guardar). null = sin foto. */
  protected readonly avatar = signal<string | null>(null);
  protected readonly errorAvatar = signal('');
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal('');
  protected readonly error = signal('');

  // valueChanges -> signal, para que el IMC y las iniciales se actualicen al escribir.
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly iniciales = computed(() =>
    (this.valores().nombre ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(palabra => palabra[0].toUpperCase()).join(''));

  protected readonly imc = computed(() => {
    const { pesoKg, estaturaCm } = this.valores();
    const imc = calcularImc(pesoKg, estaturaCm);
    return imc && { ...imc, texto: formatearCantidad(imc.valor) };
  });

  // ngOnInit: el usuario ya está disponible; se cargan sus datos en el formulario.
  ngOnInit(): void {
    this.cargarDatosGuardados();
  }

  tieneCambiosSinGuardar(): boolean {
    return this.form.dirty || this.avatar() !== (this.usuario()?.avatar ?? null);
  }

  protected async elegirFoto(archivo: File): Promise<void> {
    this.errorAvatar.set('');
    this.mensaje.set('');
    try {
      this.avatar.set(await this.imagenes.crearAvatar(archivo));
    } catch (e) {
      this.errorAvatar.set(e instanceof Error ? e.message : 'No se pudo usar esa imagen.');
    }
  }

  protected quitarFoto(): void {
    this.avatar.set(null);
    this.errorAvatar.set('');
    this.mensaje.set('');
  }

  protected descartar(): void {
    this.cargarDatosGuardados();
    this.mensaje.set('');
    this.error.set('');
  }

  protected async guardar(): Promise<void> {
    this.mensaje.set('');
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, nivel, pesoKg, estaturaCm, edad } = this.form.getRawValue();
    this.guardando.set(true);
    try {
      await this.auth.actualizarPerfil({
        nombre: nombre.trim(),
        nivel,
        pesoKg,
        estaturaCm,
        edad,
        avatar: this.avatar(),
      });
      this.form.markAsPristine();
      this.mensaje.set('Perfil actualizado.');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar el perfil.');
    } finally {
      this.guardando.set(false);
    }
  }

  /** ¿Mostrar el error de un campo? Solo si es inválido y el usuario ya lo tocó. */
  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  private cargarDatosGuardados(): void {
    const usuario = this.usuario();
    this.form.reset({
      nombre: usuario?.nombre ?? '',
      nivel: usuario?.nivel || 'Principiante',
      pesoKg: usuario?.pesoKg ?? null,
      estaturaCm: usuario?.estaturaCm ?? null,
      edad: usuario?.edad ?? null,
    });
    this.avatar.set(usuario?.avatar ?? null);
    this.errorAvatar.set('');
  }
}
