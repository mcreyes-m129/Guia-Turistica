import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/components/constants/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isAdminUser } from '@/constants/admin';
import {
  createTouristPoint,
  deleteTouristPoint,
  loadTouristPoints,
  type TouristPoint,
  updateTouristPoint,
} from '@/services/tourist-points';
import { uploadTouristImage, uploadTouristImageFile } from '@/services/image-upload';

const emptyForm = {
  id: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  direccion: '',
  horario: '',
  duracionSugerida: '',
  costoEntrada: '',
  recomendadoPara: '',
  servicios: '',
  lat: '',
  lng: '',
  imagenes: '',
};

type FormState = typeof emptyForm;

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pointToForm(point: TouristPoint): FormState {
  return {
    id: point.id,
    nombre: point.nombre,
    descripcion: point.descripcion,
    categoria: point.categoria,
    direccion: point.direccion,
    horario: point.horario,
    duracionSugerida: point.duracionSugerida,
    costoEntrada: point.costoEntrada,
    recomendadoPara: point.recomendadoPara,
    servicios: point.servicios.join(', '),
    lat: String(point.ubicacion.lat),
    lng: String(point.ubicacion.lng),
    imagenes: point.imagenes.join(', '),
  };
}

export default function AdminScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [points, setPoints] = React.useState<TouristPoint[]>([]);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const imageList = React.useMemo(() => parseCsv(form.imagenes), [form.imagenes]);
  
  const pickImagesWeb = React.useCallback(async (): Promise<File[]> => {
    if (typeof document === 'undefined') {
      throw new Error('Selector de archivos no disponible.');
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = () => {
        const files = input.files ? Array.from(input.files) : [];
        resolve(files);
      };
      input.click();
    });
  }, []);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      setIsAdmin(isAdminUser(currentUser));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAdmin(isAdminUser(nextUser));
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const loadPoints = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await loadTouristPoints();
      setPoints(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar puntos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadPoints();
  }, [isAdmin, loadPoints]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (point: TouristPoint) => {
    if (!isAdmin) {
      return;
    }
    setForm(pointToForm(point));
    setEditingId(point.id);
  };

  const handleRemoveImage = (url: string) => {
    if (!isAdmin) {
      return;
    }
    const nextImages = imageList.filter((item) => item !== url);
    handleChange('imagenes', nextImages.join(', '));
  };

  const handleDelete = (point: TouristPoint) => {
    if (!isAdmin) {
      return;
    }
    const executeDelete = async () => {
      if (deletingId) {
        return;
      }
      setDeletingId(point.id);
      try {
        await deleteTouristPoint(point.id);
        setPoints((prev) => prev.filter((item) => item.id !== point.id));
        if (editingId === point.id) {
          resetForm();
        }
      } catch (deleteError) {
        Alert.alert('Error', deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar.');
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Se eliminara "${point.nombre}".`);
      if (confirmed) {
        void executeDelete();
      }
      return;
    }

    Alert.alert('Eliminar punto', `Se eliminara "${point.nombre}".`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: executeDelete,
      },
    ]);
  };

  const handlePickImages = async () => {
    if (!isAdmin) {
      return;
    }
    if (Platform.OS === 'web') {
      try {
        const files = await pickImagesWeb();
        if (files.length === 0) {
          return;
        }

        setIsUploadingImages(true);
        const uploaded: string[] = [];
        for (const file of files) {
          const url = await uploadTouristImageFile(file, {
            userId: user?.id,
            fileName: file.name,
            mimeType: file.type,
          });
          uploaded.push(url);
        }

        if (uploaded.length > 0) {
          const current = parseCsv(form.imagenes);
          handleChange('imagenes', [...current, ...uploaded].join(', '));
        }
      } catch (uploadError) {
        Alert.alert('Error', uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.');
      } finally {
        setIsUploadingImages(false);
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permisos', 'Se requieren permisos para acceder a las imagenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    setIsUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets ?? []) {
        const url = await uploadTouristImage(asset.uri, {
          userId: user?.id,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        });
        uploaded.push(url);
      }

      if (uploaded.length > 0) {
        const current = parseCsv(form.imagenes);
        handleChange('imagenes', [...current, ...uploaded].join(', '));
      }
    } catch (uploadError) {
      Alert.alert('Error', uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      return;
    }
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.categoria.trim()) {
      Alert.alert('Datos incompletos', 'Completa al menos nombre, descripcion y categoria.');
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert('Coordenadas invalidas', 'Ingresa latitud y longitud numericas.');
      return;
    }

    const id = (editingId ?? form.id.trim()) || String(Date.now());
    const point: TouristPoint = {
      id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria.trim(),
      direccion: form.direccion.trim(),
      horario: form.horario.trim(),
      duracionSugerida: form.duracionSugerida.trim(),
      costoEntrada: form.costoEntrada.trim(),
      recomendadoPara: form.recomendadoPara.trim(),
      servicios: parseCsv(form.servicios),
      ubicacion: { lat, lng },
      imagenes: parseCsv(form.imagenes),
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateTouristPoint(point);
      } else {
        await createTouristPoint(point);
      }

      await loadPoints();
      resetForm();
    } catch (saveError) {
      Alert.alert('Error', saveError instanceof Error ? saveError.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="title">Panel de administracion</ThemedText>
        <ThemedText style={styles.centerText}>Inicia sesion para continuar.</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}
        >
          <Ionicons name="home-outline" size={18} color="#256D85" />
          <ThemedText style={styles.secondaryButtonText}>Volver al inicio</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!isAdmin) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="title">Acceso restringido</ThemedText>
        <ThemedText style={styles.centerText}>
          Tu cuenta no tiene permisos de administracion.
        </ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}
        >
          <Ionicons name="home-outline" size={18} color="#256D85" />
          <ThemedText style={styles.secondaryButtonText}>Volver al inicio</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title">Panel de administracion</ThemedText>
            <ThemedText style={styles.subtitle}>CRUD de puntos turisticos</ThemedText>
          </View>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}
          >
            <Ionicons name="home-outline" size={18} color="#256D85" />
            <ThemedText style={styles.secondaryButtonText}>Inicio</ThemedText>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <ThemedText type="defaultSemiBold">{editingId ? 'Editar punto' : 'Nuevo punto'}</ThemedText>
          <View style={styles.formGrid}>
            <TextInput
              placeholder="Nombre"
              value={form.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Categoria"
              value={form.categoria}
              onChangeText={(value) => handleChange('categoria', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripcion"
              value={form.descripcion}
              onChangeText={(value) => handleChange('descripcion', value)}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <TextInput
              placeholder="Direccion"
              value={form.direccion}
              onChangeText={(value) => handleChange('direccion', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Horario"
              value={form.horario}
              onChangeText={(value) => handleChange('horario', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Duracion sugerida"
              value={form.duracionSugerida}
              onChangeText={(value) => handleChange('duracionSugerida', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Costo de entrada"
              value={form.costoEntrada}
              onChangeText={(value) => handleChange('costoEntrada', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Recomendado para"
              value={form.recomendadoPara}
              onChangeText={(value) => handleChange('recomendadoPara', value)}
              style={styles.input}
            />
            <TextInput
              placeholder="Servicios (coma separados)"
              value={form.servicios}
              onChangeText={(value) => handleChange('servicios', value)}
              style={styles.input}
            />
            <View style={styles.rowInputs}>
              <TextInput
                placeholder="Latitud"
                value={form.lat}
                onChangeText={(value) => handleChange('lat', value)}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Longitud"
                value={form.lng}
                onChangeText={(value) => handleChange('lng', value)}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>
            <TextInput
              placeholder="Imagenes (URL o path, coma separados)"
              value={form.imagenes}
              onChangeText={(value) => handleChange('imagenes', value)}
              style={styles.input}
            />
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handlePickImages}
              disabled={isUploadingImages || isSaving}>
              <Ionicons name="cloud-upload-outline" size={18} color="#256D85" />
              <ThemedText style={styles.secondaryButtonText}>
                {isUploadingImages ? 'Subiendo...' : 'Cargar imagenes'}
              </ThemedText>
            </Pressable>
            <ThemedText style={styles.helperText}>
              Las imagenes se suben al bucket "tourist-points" de Supabase Storage.
            </ThemedText>
            {imageList.length > 0 ? (
              <View style={styles.imageGrid}>
                {imageList.map((url) => (
                  <View key={url} style={styles.imageTile}>
                    <Image source={{ uri: url }} style={styles.imagePreview} contentFit="cover" />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(url)}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.formActions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleSave}
              disabled={isSaving || isUploadingImages}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <ThemedText style={styles.primaryButtonText} type="subtitle">
                {editingId ? 'Actualizar' : 'Crear'}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <Ionicons name="refresh-outline" size={18} color="#256D85" />
              <ThemedText style={styles.secondaryButtonText}>Limpiar</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.listHeader}>
          <ThemedText type="defaultSemiBold">Listado</ThemedText>
          <Pressable style={styles.secondaryButton} onPress={loadPoints}>
            <Ionicons name="sync-outline" size={18} color="#256D85" />
            <ThemedText style={styles.secondaryButtonText}>Recargar</ThemedText>
          </Pressable>
        </View>

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        {isLoading ? (
          <ThemedText style={styles.centerText}>Cargando puntos...</ThemedText>
        ) : (
          points.map((point) => (
            <View key={point.id} style={styles.pointCard}>
              <View style={styles.pointInfo}>
                {point.imagenes[0] ? (
                  <Image source={{ uri: point.imagenes[0] }} style={styles.pointThumb} contentFit="cover" />
                ) : null}
                <ThemedText type="subtitle" style={styles.pointTitle}>
                  {point.nombre}
                </ThemedText>
                <ThemedText style={styles.pointMeta}>{point.categoria}</ThemedText>
              </View>
              <View style={styles.pointActions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => handleEdit(point)}
                  disabled={isSaving || isUploadingImages || deletingId === point.id}>
                  <Ionicons name="create-outline" size={16} color="#256D85" />
                  <ThemedText style={styles.editButtonText}>Editar</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(point)}
                  disabled={isSaving || isUploadingImages || deletingId === point.id}>
                  <Ionicons name="trash-outline" size={16} color="#DB4437" />
                  <ThemedText style={styles.deleteButtonText}>
                    {deletingId === point.id ? 'Eliminando...' : 'Borrar'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#F6F6F6',
  },
  centerText: {
    textAlign: 'center',
    color: '#4F6F7A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    color: '#4F6F7A',
    marginTop: 4,
  },
  helperText: {
    color: '#5A7C86',
    fontSize: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageTile: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EAF2F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(22, 42, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  formGrid: {
    gap: 12,
  },
  input: {
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E1EBEF',
    color: '#1C3E49',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#256D85',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E2E8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#256D85',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1EBEF',
    gap: 12,
  },
  pointInfo: {
    gap: 4,
  },
  pointThumb: {
    width: 100,
    height: 64,
    borderRadius: 12,
    marginBottom: 6,
  },
  pointTitle: {
    color: '#1C3E49',
  },
  pointMeta: {
    color: '#4F6F7A',
  },
  pointActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE0E6',
  },
  editButtonText: {
    color: '#256D85',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1C7C3',
  },
  deleteButtonText: {
    color: '#DB4437',
    fontWeight: '600',
  },
  errorText: {
    color: '#B42318',
  },
});
