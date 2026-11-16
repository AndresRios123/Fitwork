export const gruposMusculares = [
  'Pecho', 'Espalda', 'Piernas', 'Glúteos', 'Hombros', 'Brazos', 'Abdomen',
] as const;

export const equipos = [
  'Barra', 'Mancuernas', 'Polea', 'Peso corporal',
] as const;

type GrupoMuscular = (typeof gruposMusculares)[number];
type Equipo = (typeof equipos)[number];

export interface Ejercicio {
  readonly id: string;
  readonly nombre: string;
  readonly grupo: GrupoMuscular;
  readonly equipo: Equipo;
  readonly descripcion: string;
}
