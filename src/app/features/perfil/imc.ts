export interface Imc {
  readonly valor: number;
  readonly categoria: 'Bajo peso' | 'Normal' | 'Sobrepeso' | 'Obesidad';
}

/** Índice de masa corporal (OMS): peso / estatura². null si falta algún dato. */
export function calcularImc(pesoKg: number | null | undefined, estaturaCm: number | null | undefined): Imc | null {
  if (!pesoKg || !estaturaCm || pesoKg <= 0 || estaturaCm <= 0) {
    return null;
  }
  const metros = estaturaCm / 100;
  const valor = Math.round((pesoKg / (metros * metros)) * 10) / 10;
  const categoria = valor < 18.5 ? 'Bajo peso' : valor < 25 ? 'Normal' : valor < 30 ? 'Sobrepeso' : 'Obesidad';
  return { valor, categoria };
}
