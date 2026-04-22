// Datos de puntos de interés de Catamarca
export type PuntoInteres = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  direccion: string;
  horario: string;
  duracionSugerida: string;
  costoEntrada: string;
  recomendadoPara: string;
  servicios: string[];
  ubicacion: {
    lat: number;
    lng: number;
  };
  imagenes: string[];
};

export const puntosDeInteres: PuntoInteres[] = [
  {
    id: '1',
    nombre: 'Catedral Basílica de Nuestra Señora del Valle',
    descripcion: 'Templo religioso emblemático de la ciudad de San Fernando del Valle de Catamarca.',
    categoria: 'Patrimonio religioso e historico',
    direccion: 'Sarmiento 550, San Fernando del Valle de Catamarca',
    horario: 'Lunes a domingo, 08:00 a 20:00',
    duracionSugerida: '45 a 60 minutos',
    costoEntrada: 'Entrada libre y gratuita',
    recomendadoPara: 'Turismo cultural, fotografia y visitas familiares',
    servicios: ['Visitas guiadas', 'Acceso peatonal', 'Zona centrica con cafeterias'],
    ubicacion: { lat: -28.4696, lng: -65.7795 },
    imagenes: ['/assets/images/catedral.jpg'],
  },
  {
    id: '2',
    nombre: 'Dique El Jumeal',
    descripcion: 'Espacio natural ideal para caminatas, deportes y actividades al aire libre.',
    categoria: 'Naturaleza y recreacion',
    direccion: 'Av. Bartolome de Castro, El Jumeal, Catamarca',
    horario: 'Abierto las 24 horas',
    duracionSugerida: '1 a 2 horas',
    costoEntrada: 'Sin costo',
    recomendadoPara: 'Senderismo suave, ciclismo y mateadas al atardecer',
    servicios: ['Estacionamiento cercano', 'Circuito peatonal', 'Miradores'],
    ubicacion: { lat: -28.4642, lng: -65.7861 },
    imagenes: ['/assets/images/jumeal.webp'],
  },
  {
    id: '3',
    nombre: 'Cuesta del Portezuelo',
    descripcion: 'Mirador panorámico con vistas espectaculares de la provincia.',
    categoria: 'Mirador y paisaje de montana',
    direccion: 'Ruta Provincial 2, camino a El Portezuelo, Catamarca',
    horario: 'Todos los dias, recomendable de 09:00 a 19:00',
    duracionSugerida: '1 hora',
    costoEntrada: 'Acceso gratuito',
    recomendadoPara: 'Fotografia panoramica y recorridos en auto',
    servicios: ['Miradores naturales', 'Paradas escenicas', 'Acceso vehicular'],
    ubicacion: { lat: -28.4967, lng: -65.6502 },
    imagenes: ['/assets/images/portezuelo.jpg'],
  },
];
