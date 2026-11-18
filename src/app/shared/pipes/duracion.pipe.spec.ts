import { DuracionPipe } from './duracion.pipe';

describe('DuracionPipe', () => {
  const pipe = new DuracionPipe();

  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1 h'],
    [95, '1 h 35 min'],
    [420, '7 h'],
  ])('%i minutos -> "%s"', (minutos, texto) => {
    expect(pipe.transform(minutos)).toBe(texto);
  });

  it('devuelve texto vacío si no hay valor', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
