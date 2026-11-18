import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';

interface PuntoTemporal {
  readonly fecha: string;
  readonly valor: number;
}

const formatoValor = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC',
});

@Component({
  selector: 'app-grafico-evolucion',
  template: '<canvas #grafico aria-hidden="true"></canvas>',
  styles: 'canvas { display: block; width: 100%; height: 15rem; margin-top: .75rem; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoEvolucion {
  readonly puntos = input.required<readonly PuntoTemporal[]>();
  readonly unidad = input.required<string>();

  private readonly grafico = viewChild.required<ElementRef<HTMLCanvasElement>>('grafico');

  constructor() {
    afterRenderEffect(limpiar => {
      const canvas = this.grafico().nativeElement;
      const puntos = this.puntos();
      const unidad = this.unidad();
      const dibujar = () => dibujarEvolucion(canvas, puntos, unidad);

      dibujar();
      const observador = new ResizeObserver(dibujar);
      observador.observe(canvas);
      limpiar(() => observador.disconnect());
    });
  }
}

function dibujarEvolucion(canvas: HTMLCanvasElement, puntos: readonly PuntoTemporal[], unidad: string): void {
  const ancho = canvas.clientWidth;
  const alto = canvas.clientHeight;
  const contexto = canvas.getContext('2d');
  if (!contexto || !ancho || !alto || puntos.length < 2) {
    return;
  }

  const escala = window.devicePixelRatio || 1;
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  contexto.scale(escala, escala);

  const estilos = getComputedStyle(canvas);
  const colorTexto = estilos.getPropertyValue('--gray-700').trim();
  const colorLinea = estilos.getPropertyValue('--color-primary').trim();
  contexto.font = `12px ${estilos.fontFamily}`;

  let minimo = puntos[0].valor;
  let maximo = minimo;
  for (const { valor } of puntos) {
    minimo = Math.min(minimo, valor);
    maximo = Math.max(maximo, valor);
  }
  const margen = maximo === minimo ? 1 : (maximo - minimo) * .1;
  minimo = Math.max(0, minimo - margen);
  maximo += margen;

  const inicio = Date.parse(puntos[0].fecha);
  const fin = Date.parse(puntos[puntos.length - 1].fecha);
  const unidadY = (valor: number) => `${formatoValor.format(valor)} ${unidad}`;
  const izquierda = Math.max(contexto.measureText(unidadY(maximo)).width, contexto.measureText(unidadY(minimo)).width) + 10;
  const derecha = ancho - 8;
  const superior = 12;
  const inferior = alto - 28;
  const x = (fecha: string) => izquierda + (Date.parse(fecha) - inicio) / (fin - inicio || 1) * (derecha - izquierda);
  const y = (valor: number) => inferior - (valor - minimo) / (maximo - minimo) * (inferior - superior);

  contexto.strokeStyle = estilos.getPropertyValue('--gray-300').trim();
  contexto.fillStyle = colorTexto;
  contexto.textBaseline = 'middle';
  contexto.textAlign = 'right';
  for (let marca = 0; marca <= 4; marca++) {
    const valor = minimo + (maximo - minimo) * marca / 4;
    const altura = y(valor);
    contexto.beginPath();
    contexto.moveTo(izquierda, altura);
    contexto.lineTo(derecha, altura);
    contexto.stroke();
    contexto.fillText(unidadY(valor), izquierda - 6, altura);
  }

  contexto.textBaseline = 'bottom';
  contexto.textAlign = 'left';
  contexto.fillText(formatoFecha.format(inicio), izquierda, alto);
  contexto.textAlign = 'right';
  contexto.fillText(formatoFecha.format(fin), derecha, alto);

  contexto.strokeStyle = colorLinea;
  contexto.fillStyle = colorLinea;
  contexto.lineWidth = 2.5;
  contexto.beginPath();
  contexto.moveTo(x(puntos[0].fecha), y(puntos[0].valor));
  for (const punto of puntos.slice(1)) {
    contexto.lineTo(x(punto.fecha), y(punto.valor));
  }
  contexto.stroke();

  for (const punto of puntos) {
    contexto.beginPath();
    contexto.arc(x(punto.fecha), y(punto.valor), 3.5, 0, Math.PI * 2);
    contexto.fill();
  }
}
