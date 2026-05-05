# Guia Turistica Catamarca

## Descripcion
Guia Turistica Catamarca es una aplicacion para explorar puntos de interes de San Fernando del Valle de Catamarca. La app permite:

1. Visualizar una lista de lugares turisticos en formato de tarjetas.
2. Ingresar al detalle de cada punto turistico.
3. Ver el mapa con la ubicacion del lugar (web y dispositivos moviles).
4. Consultar informacion adicional como categoria, direccion, horario, costo y servicios.

## Funcionalidades principales
- Navegacion con Expo Router.
- Vista de detalle por punto turistico.
- Mapas en Android/iOS con React Native Maps.
- Mapa embebido en web mediante Google Maps.
- Integracion con Supabase para autenticacion y datos.

## Tecnologias utilizadas
1. Expo
2. React Native
3. TypeScript
4. Expo Router
5. React Native Maps (Android/iOS)
6. Google Maps embed para visualizacion web
7. Supabase

## Requisitos
- Node.js LTS
- Expo CLI (se usa a traves de los scripts)
- Android Studio o Xcode si se ejecuta en dispositivo/emulador

## Instalacion y ejecucion
1. Clonar el repositorio.
2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env` en la raiz del proyecto (opcional pero recomendado para geocodificacion con Google):

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_de_google
```

4. Ejecutar en modo desarrollo:

```bash
npm run start
```

5. Ejecutar en web:

```bash
npm run web
```

6. Ejecutar en Android:

```bash
npm run android
```

## Scripts disponibles
- `npm run start`: inicia el servidor de desarrollo de Expo.
- `npm run web`: inicia la version web.
- `npm run android`: inicia la app en Android.
- `npm run ios`: inicia la app en iOS.
- `npm run lint`: ejecuta el linter.

## Estructura del proyecto
- `app/`: rutas y pantallas (Expo Router).
- `components/`: componentes reutilizables.
- `services/`: acceso a datos, favoritos y geolocalizacion.
- `assets/`: imagenes y recursos.
- `supabase/`: migraciones y esquema.

## Configuracion de Supabase
Las credenciales de Supabase estan definidas en [components/constants/supabase.ts](components/constants/supabase.ts). Si vas a usar un proyecto propio, reemplaza la URL y la clave anonima por tus valores.

## Nombre del estudiante
Mario Ivan Carreno - MU N 129
