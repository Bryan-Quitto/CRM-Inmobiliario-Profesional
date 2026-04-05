import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image 
} from '@react-pdf/renderer';
import type { Propiedad } from '../types';
import type { PerfilAgente } from '../../auth/api/perfil';

// Registrar fuentes (opcional, pero mejora el aspecto)
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400 },
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyAZ9hjp-Ek-_EeA.woff', fontWeight: 700 },
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff', fontWeight: 900 },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica', // Usamos Helvetica por compatibilidad garantizada
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'black',
    color: '#111827',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#4B5563',
    marginTop: 20,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    paddingLeft: 10,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    objectFit: 'contain',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridItem: {
    width: '48%', // 2 columnas con gap
    marginBottom: 10,
  },
  featureCard: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    width: '19%', // 5 columnas
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  featureValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  agentInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  agentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  agentDetails: {
    flexDirection: 'column',
  },
  agentName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  agentContact: {
    fontSize: 8,
    color: '#6B7280',
  },
  galleryImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    objectFit: 'contain',
    backgroundColor: '#F3F4F6',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
  }
});

interface PropiedadFichaPDFProps {
  propiedad: Propiedad;
  perfil?: PerfilAgente;
  principalBase64?: string | null;
  mediaBase64Map?: Record<string, string>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper para asegurar compatibilidad con el PDF
const getCompatibleImageUrl = (id: string, originalUrl: string, map?: Record<string, string>) => {
  // Si tenemos la versión JPG/Base64 en el mapa, es la prioridad absoluta
  if (map && map[id]) return map[id];
  // Si no, devolvemos la URL original (probablemente falle si es WebP, pero es nuestro fallback)
  return originalUrl;
};

export const PropiedadFichaPDF: React.FC<PropiedadFichaPDFProps> = ({ 
  propiedad, 
  perfil, 
  principalBase64,
  mediaBase64Map 
}) => {
  const principalImage = principalBase64 || getCompatibleImageUrl('principal', propiedad.imagenPortadaUrl || '', mediaBase64Map);
  
  return (
    <Document title={`Ficha - ${propiedad.titulo}`}>
      {/* Página Principal */}
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{propiedad.titulo}</Text>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>{propiedad.direccion}, {propiedad.sector}, {propiedad.ciudad}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>{formatCurrency(propiedad.precio)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase' }}>Precio de Lista</Text>
          </View>
        </View>

        {/* Imagen Principal */}
        {principalImage ? (
          <Image src={principalImage} style={styles.mainImage} />
        ) : null}

        {/* Características Clave */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Habitaciones</Text>
            <Text style={styles.featureValue}>{propiedad.habitaciones}</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Baños</Text>
            <Text style={styles.featureValue}>{Number(propiedad.banos)}</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Área Total</Text>
            <Text style={styles.featureValue}>{propiedad.areaTotal} m²</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Tipo</Text>
            <Text style={styles.featureValue}>{propiedad.tipoPropiedad}</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Operación</Text>
            <Text style={styles.featureValue}>{propiedad.operacion}</Text>
          </View>
        </View>

        {/* Descripción */}
        <Text style={styles.sectionTitle}>Descripción del Inmueble</Text>
        <Text style={styles.description}>{propiedad.descripcion}</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.agentInfo}>
            {perfil?.logoUrl ? (
              <Image src={perfil.logoUrl} style={{ width: 80, height: 30, objectFit: 'contain' }} />
            ) : (
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4F46E5' }}>{perfil?.agencia || 'Inmobiliaria'}</Text>
            )}
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{perfil?.nombre} {perfil?.apellido}</Text>
              <Text style={styles.agentContact}>{perfil?.email} | {perfil?.telefono || 'N/A'}</Text>
            </View>
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>

      {/* Páginas de Galería */}
      {propiedad.secciones?.map((seccion) => (
        <Page key={seccion.id} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>{seccion.nombre}</Text>
          {seccion.descripcion && (
            <Text style={[styles.description, { marginBottom: 15 }]}>{seccion.descripcion}</Text>
          )}
          
          <View style={styles.grid}>
            {seccion.media.map((img) => (
              <View key={img.id} style={styles.gridItem}>
                <Image src={getCompatibleImageUrl(img.id, img.urlPublica, mediaBase64Map)} style={styles.galleryImage} />
                {img.descripcion && (
                  <Text style={{ fontSize: 7, color: '#6B7280', marginTop: 4 }}>{img.descripcion}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Footer en Galería */}
          <View style={styles.footer} fixed>
            <View style={styles.agentInfo}>
              {perfil?.logoUrl ? (
                <Image src={perfil.logoUrl} style={{ width: 80, height: 30, objectFit: 'contain' }} />
              ) : (
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4F46E5' }}>{perfil?.agencia || 'Inmobiliaria'}</Text>
              )}
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>{perfil?.nombre} {perfil?.apellido}</Text>
                <Text style={styles.agentContact}>{perfil?.email} | {perfil?.telefono || 'N/A'}</Text>
              </View>
            </View>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
              `Página ${pageNumber} de ${totalPages}`
            )} />
          </View>
        </Page>
      ))}
    </Document>
  );
};
