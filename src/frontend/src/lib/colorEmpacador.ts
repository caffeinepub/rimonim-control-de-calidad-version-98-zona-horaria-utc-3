export interface ColorOption {
  nombre: string;
  valor: string;
}

export const COLORES_EMPACADOR: ColorOption[] = [
  { nombre: 'Rojo', valor: '#ef4444' },
  { nombre: 'Azul', valor: '#3b82f6' },
  { nombre: 'Verde', valor: '#22c55e' },
  { nombre: 'Amarillo', valor: '#eab308' },
  { nombre: 'Naranja', valor: '#f97316' },
  { nombre: 'Morado', valor: '#a855f7' },
  { nombre: 'Rosa', valor: '#ec4899' },
  { nombre: 'Café', valor: '#92400e' },
];

export function getColorInfo(colorValue: string): ColorOption | undefined {
  return COLORES_EMPACADOR.find(c => c.valor === colorValue);
}

export function getColorName(colorValue: string): string {
  const colorInfo = getColorInfo(colorValue);
  return colorInfo?.nombre || colorValue;
}
