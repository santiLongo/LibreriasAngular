/**
 * Data de prueba para la grilla. Es un type alias y no una interface a
 * propósito: GridComponent<T extends Record<string, any>> sólo acepta tipos
 * con index signature implícita, y las interfaces no la tienen.
 */
export type Viaje = {
  id: number;
  numero: string;
  chofer: string;
  patente: string;
  origen: string;
  destino: string;
  kilometros: number;
  importe: number;
  cuit: number;
  fecha: Date;
  salida: Date;
  estado: EstadoViaje;
  facturado: boolean;
};

export type EstadoViaje = 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';

export const ESTADOS: EstadoViaje[] = [
  'PENDIENTE',
  'EN_CURSO',
  'FINALIZADO',
  'CANCELADO',
];

const CHOFERES = [
  'Juan Pérez',
  'Marta Gómez',
  'Carlos Ruiz',
  'Ana Torres',
  'Luis Fernández',
  'Sofía Ramírez',
  'Diego Sosa',
  'Valeria Ponce',
];

const LOCALIDADES = [
  'Buenos Aires',
  'Rosario',
  'Córdoba',
  'Mendoza',
  'Mar del Plata',
  'Bahía Blanca',
  'Santa Fe',
  'Tucumán',
  'Salta',
  'Neuquén',
];

/** LCG simple: la data sale siempre igual, así las pruebas son repetibles. */
function pseudoRandom(seed: number): () => number {
  let estado = seed;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

export function generarViajes(cantidad = 47, seed = 7): Viaje[] {
  const random = pseudoRandom(seed);
  const hoy = new Date();

  return Array.from({ length: cantidad }, (_, i) => {
    const origen = LOCALIDADES[Math.floor(random() * LOCALIDADES.length)];

    let destino = origen;
    while (destino === origen) {
      destino = LOCALIDADES[Math.floor(random() * LOCALIDADES.length)];
    }

    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - Math.floor(random() * 60));

    const salida = new Date(fecha);
    salida.setHours(Math.floor(random() * 24), Math.floor(random() * 60), 0, 0);

    const estado = ESTADOS[Math.floor(random() * ESTADOS.length)];

    return {
      id: i + 1,
      numero: `V-${String(10000 + i * 7).padStart(5, '0')}`,
      chofer: CHOFERES[Math.floor(random() * CHOFERES.length)],
      patente: patente(random),
      origen,
      destino,
      kilometros: Math.floor(random() * 1800) + 50,
      importe: Math.round(random() * 950000) / 100 + 1000,
      cuit: 20000000000 + Math.floor(random() * 9999999) * 10 + 3,
      fecha,
      salida,
      estado,
      facturado: estado === 'FINALIZADO' && random() > 0.4,
    };
  });
}

function patente(random: () => number): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letra = () => letras[Math.floor(random() * letras.length)];
  const numero = () => Math.floor(random() * 10);

  return `${letra()}${letra()}${numero()}${numero()}${numero()}${letra()}${letra()}`;
}
