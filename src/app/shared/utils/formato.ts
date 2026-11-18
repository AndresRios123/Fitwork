// Formatos en español usando Intl (no necesita registrar locales de Angular).
const LOCALE = 'es-CO';

export function formatearNumero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/** Hasta 1 decimal, solo si hace falta: 32 -> "32", 5.25 -> "5,3". */
export function formatearCantidad(valor: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(valor);
}

/** 45 -> "45 min", 95 -> "1 h 35 min", 120 -> "2 h". */
export function formatearDuracion(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (!horas) {
    return `${resto} min`;
  }
  return resto ? `${formatearNumero(horas)} h ${resto} min` : `${formatearNumero(horas)} h`;
}

/** "2026-11-15" -> "15 nov". Se interpreta como fecha local, no UTC. */
export function formatearFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
    .format(new Date(anio, mes - 1, dia))
    .replace('.', '');
}

/** +12,5 % / −4,2 % / 0 %. */
export function formatearVariacion(variacion: number): string {
  const signo = variacion > 0 ? '+' : variacion < 0 ? '−' : '';
  return `${signo}${formatearNumero(Math.abs(variacion), 1).replace(/,0$/, '')} %`;
}
