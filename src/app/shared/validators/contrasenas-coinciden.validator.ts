import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador de GRUPO: compara dos campos del mismo formulario.
// Si no son iguales, el formulario tiene el error { noCoinciden: true }.
export function contrasenasCoinciden(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value;
    const repetido = grupo.get(confirmacion)?.value;
    return valor === repetido ? null : { noCoinciden: true };
  };
}