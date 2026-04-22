# Guia Turistica Catamarca

## Descripcion de la aplicacion
Guia Turistica Catamarca es una aplicacion desarrollada para explorar puntos de interes de San Fernando del Valle de Catamarca. La app permite:

1. Visualizar una lista de lugares turisticos en formato de tarjetas.
2. Ingresar al detalle de cada punto turistico.
3. Ver mapa con ubicacion del lugar (web y dispositivos moviles).
4. Consultar informacion adicional como categoria, direccion, horario, costo y servicios.

## Tecnologias utilizadas
1. Expo
2. React Native
3. TypeScript
4. Expo Router
5. React Native Maps (Android/iOS)
6. Google Maps embed para visualizacion web
7. Supabase (autenticacion)

## Instrucciones de instalacion y ejecucion
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

## Nombre del estudiante
Mario Ivan Carreño - MU N° 129
