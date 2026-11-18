import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { contrasenasCoinciden } from '../../../shared/validators/contrasenas-coinciden.validator';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: '../auth.scss', // estilos compartidos con login
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  // El segundo argumento de group() aplica validadores a TODO el formulario:
  // así se puede comparar "password" con "confirmar".
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: contrasenasCoinciden('password', 'confirmar') },
  );

  protected async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    try {
      const { nombre, email, password } = this.form.getRawValue();
      await this.auth.register({ nombre, email, password });
      this.router.navigate(['/panel']);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      this.cargando.set(false);
    }
  }
}