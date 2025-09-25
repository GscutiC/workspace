import { PrismaClient, DistrictType } from '@prisma/client';

const prisma = new PrismaClient();

interface DistrictConfig {
  zoneCode: string;
  name: string;
  description: string;
  districtType: DistrictType;
  color: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  basePriceMultiplier: number;
  taxRate: number;
}

// Configuración correcta de los 16 distritos
const CORRECT_DISTRICTS: DistrictConfig[] = [
  // Fila 1
  {
    zoneCode: "D-0101",
    name: "Centro Empresarial Norte",
    description: "Distrito central de negocios con oficinas premium",
    districtType: DistrictType.COMMERCIAL,
    color: "#4A90E2",
    bounds: { x1: 0, y1: 0, x2: 48, y2: 36 },
    basePriceMultiplier: 1.5,
    taxRate: 0.08
  },
  {
    zoneCode: "D-0102",
    name: "Distrito Verde",
    description: "Área residencial con espacios verdes",
    districtType: DistrictType.RESIDENTIAL,
    color: "#5CB85C",
    bounds: { x1: 48, y1: 0, x2: 96, y2: 36 },
    basePriceMultiplier: 1.2,
    taxRate: 0.06
  },
  {
    zoneCode: "D-0103",
    name: "Centro Cultural",
    description: "Distrito cultural y de entretenimiento",
    districtType: DistrictType.MIXED_USE,
    color: "#F0AD4E",
    bounds: { x1: 96, y1: 0, x2: 144, y2: 36 },
    basePriceMultiplier: 1.3,
    taxRate: 0.07
  },
  {
    zoneCode: "D-0104",
    name: "Distrito Administrativo",
    description: "Oficinas gubernamentales y servicios públicos",
    districtType: DistrictType.ADMINISTRATIVE,
    color: "#D9534F",
    bounds: { x1: 144, y1: 0, x2: 192, y2: 36 },
    basePriceMultiplier: 1.0,
    taxRate: 0.05
  },

  // Fila 2
  {
    zoneCode: "D-0201",
    name: "Distrito Tecnológico",
    description: "Hub de tecnología e innovación",
    districtType: DistrictType.INDUSTRIAL,
    color: "#9B59B6",
    bounds: { x1: 0, y1: 36, x2: 48, y2: 72 },
    basePriceMultiplier: 1.4,
    taxRate: 0.06
  },
  {
    zoneCode: "D-0202",
    name: "Distrito de Servicios",
    description: "Servicios profesionales y consultoría",
    districtType: DistrictType.COMMERCIAL,
    color: "#3498DB",
    bounds: { x1: 48, y1: 36, x2: 96, y2: 72 },
    basePriceMultiplier: 1.3,
    taxRate: 0.07
  },
  {
    zoneCode: "D-0203",
    name: "Distrito Familiar",
    description: "Zona residencial familiar con servicios",
    districtType: DistrictType.RESIDENTIAL,
    color: "#E67E22",
    bounds: { x1: 96, y1: 36, x2: 144, y2: 72 },
    basePriceMultiplier: 1.1,
    taxRate: 0.05
  },
  {
    zoneCode: "D-0204",
    name: "Distrito Logístico",
    description: "Centro de distribución y logística",
    districtType: DistrictType.INDUSTRIAL,
    color: "#95A5A6",
    bounds: { x1: 144, y1: 36, x2: 192, y2: 72 },
    basePriceMultiplier: 0.9,
    taxRate: 0.04
  },

  // Fila 3
  {
    zoneCode: "D-0301",
    name: "Distrito Comercial",
    description: "Centro comercial y retail",
    districtType: DistrictType.COMMERCIAL,
    color: "#1ABC9C",
    bounds: { x1: 0, y1: 72, x2: 48, y2: 108 },
    basePriceMultiplier: 1.6,
    taxRate: 0.09
  },
  {
    zoneCode: "D-0302",
    name: "Distrito de Salud",
    description: "Centros médicos y de bienestar",
    districtType: DistrictType.MIXED_USE,
    color: "#F39C12",
    bounds: { x1: 48, y1: 72, x2: 96, y2: 108 },
    basePriceMultiplier: 1.4,
    taxRate: 0.06
  },
  {
    zoneCode: "D-0303",
    name: "Distrito Educativo",
    description: "Instituciones educativas y centros de formación",
    districtType: DistrictType.MIXED_USE,
    color: "#8E44AD",
    bounds: { x1: 96, y1: 72, x2: 144, y2: 108 },
    basePriceMultiplier: 1.1,
    taxRate: 0.04
  },
  {
    zoneCode: "D-0304",
    name: "Distrito Industrial",
    description: "Zona industrial y manufactura",
    districtType: DistrictType.INDUSTRIAL,
    color: "#34495E",
    bounds: { x1: 144, y1: 72, x2: 192, y2: 108 },
    basePriceMultiplier: 0.8,
    taxRate: 0.03
  },

  // Fila 4
  {
    zoneCode: "D-0401",
    name: "Distrito de Eventos",
    description: "Centros de convenciones y eventos",
    districtType: DistrictType.RECREATIONAL,
    color: "#E74C3C",
    bounds: { x1: 0, y1: 108, x2: 48, y2: 144 },
    basePriceMultiplier: 1.7,
    taxRate: 0.08
  },
  {
    zoneCode: "D-0402",
    name: "Distrito Residencial Premium",
    description: "Residencias de alta gama",
    districtType: DistrictType.RESIDENTIAL,
    color: "#2ECC71",
    bounds: { x1: 48, y1: 108, x2: 96, y2: 144 },
    basePriceMultiplier: 2.0,
    taxRate: 0.10
  },
  {
    zoneCode: "D-0403",
    name: "Distrito Deportivo",
    description: "Instalaciones deportivas y recreativas",
    districtType: DistrictType.RECREATIONAL,
    color: "#F1C40F",
    bounds: { x1: 96, y1: 108, x2: 144, y2: 144 },
    basePriceMultiplier: 1.2,
    taxRate: 0.05
  },
  {
    zoneCode: "D-0405",
    name: "Distrito Mixto Sur",
    description: "Zona mixta de usos diversos",
    districtType: DistrictType.MIXED_USE,
    color: "#BDC3C7",
    bounds: { x1: 144, y1: 108, x2: 192, y2: 144 },
    basePriceMultiplier: 1.1,
    taxRate: 0.06
  }
];

async function verifyAndFixDistricts() {
  console.log('🔍 Verificando sistema de distritos...');

  try {
    // 1. Obtener organización y espacio existentes
    const organization = await prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!organization) {
      console.error('❌ No se encontró organización. Ejecuta el seed primero.');
      return;
    }

    const space = await prisma.space.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'asc' }
    });

    if (!space) {
      console.error('❌ No se encontró espacio. Ejecuta el seed primero.');
      return;
    }

    console.log(`✅ Usando organización: ${organization.name} (${organization.id})`);
    console.log(`✅ Usando espacio: ${space.name} (${space.id})`);

    // 2. Verificar distritos existentes
    const existingDistricts = await prisma.district.findMany({
      where: {
        organizationId: organization.id,
        spaceId: space.id
      },
      orderBy: { zoneCode: 'asc' }
    });

    console.log(`📊 Distritos existentes: ${existingDistricts.length}`);

    // 3. Analizar qué necesita ser corregido
    const correctZoneCodes = CORRECT_DISTRICTS.map(d => d.zoneCode);
    const existingZoneCodes = existingDistricts.map(d => d.zoneCode);
    
    const missingDistricts = CORRECT_DISTRICTS.filter(
      correct => !existingZoneCodes.includes(correct.zoneCode)
    );
    
    const extraDistricts = existingDistricts.filter(
      existing => !correctZoneCodes.includes(existing.zoneCode)
    );

    const incorrectDistricts = existingDistricts.filter(existing => {
      const correct = CORRECT_DISTRICTS.find(c => c.zoneCode === existing.zoneCode);
      if (!correct) return false;
      
      // Verificar si los datos son diferentes
      const existingBounds = typeof existing.bounds === 'string' 
        ? JSON.parse(existing.bounds) 
        : existing.bounds;
        
      return (
        existing.name !== correct.name ||
        existing.districtType !== correct.districtType ||
        existing.color !== correct.color ||
        JSON.stringify(existingBounds) !== JSON.stringify(correct.bounds) ||
        existing.basePriceMultiplier !== correct.basePriceMultiplier ||
        existing.taxRate !== correct.taxRate
      );
    });

    console.log('\n📋 Análisis del sistema:');
    console.log(`   • Distritos faltantes: ${missingDistricts.length}`);
    console.log(`   • Distritos incorrectos: ${incorrectDistricts.length}`);
    console.log(`   • Distritos extra: ${extraDistricts.length}`);

    if (missingDistricts.length > 0) {
      console.log('\n🆕 Distritos faltantes:');
      missingDistricts.forEach(d => console.log(`   • ${d.zoneCode}: ${d.name}`));
    }

    if (incorrectDistricts.length > 0) {
      console.log('\n🔧 Distritos que necesitan corrección:');
      incorrectDistricts.forEach(d => console.log(`   • ${d.zoneCode}: ${d.name}`));
    }

    if (extraDistricts.length > 0) {
      console.log('\n🗑️ Distritos extra (serán eliminados):');
      extraDistricts.forEach(d => console.log(`   • ${d.zoneCode}: ${d.name}`));
    }

    // 4. Aplicar correcciones
    console.log('\n🔨 Aplicando correcciones...');

    // Eliminar distritos extra
    if (extraDistricts.length > 0) {
      console.log('🗑️ Eliminando distritos extra...');
      for (const district of extraDistricts) {
        await prisma.district.delete({
          where: { id: district.id }
        });
        console.log(`   ✅ Eliminado: ${district.zoneCode}`);
      }
    }

    // Corregir distritos incorrectos
    if (incorrectDistricts.length > 0) {
      console.log('🔧 Corrigiendo distritos...');
      for (const district of incorrectDistricts) {
        const correct = CORRECT_DISTRICTS.find(c => c.zoneCode === district.zoneCode)!;
        
        await prisma.district.update({
          where: { id: district.id },
          data: {
            name: correct.name,
            description: correct.description,
            districtType: correct.districtType,
            color: correct.color,
            bounds: JSON.stringify(correct.bounds),
            basePriceMultiplier: correct.basePriceMultiplier,
            taxRate: correct.taxRate,
          }
        });
        console.log(`   ✅ Corregido: ${district.zoneCode}`);
      }
    }

    // Crear distritos faltantes
    if (missingDistricts.length > 0) {
      console.log('🆕 Creando distritos faltantes...');
      for (const district of missingDistricts) {
        await prisma.district.create({
          data: {
            name: district.name,
            description: district.description,
            districtType: district.districtType,
            color: district.color,
            zoneCode: district.zoneCode,
            bounds: JSON.stringify(district.bounds),
            basePriceMultiplier: district.basePriceMultiplier,
            taxRate: district.taxRate,
            organizationId: organization.id,
            spaceId: space.id,
          }
        });
        console.log(`   ✅ Creado: ${district.zoneCode}`);
      }
    }

    // 5. Verificación final
    const finalDistricts = await prisma.district.findMany({
      where: {
        organizationId: organization.id,
        spaceId: space.id
      },
      orderBy: { zoneCode: 'asc' }
    });

    console.log('\n✅ Verificación completada');
    console.log(`📊 Total de distritos: ${finalDistricts.length}/16`);
    
    if (finalDistricts.length === 16) {
      console.log('🎉 ¡Sistema de distritos configurado correctamente!');
      
      // Mostrar resumen
      console.log('\n📋 Resumen de distritos:');
      finalDistricts.forEach((district, index) => {
        const bounds = typeof district.bounds === 'string' 
          ? JSON.parse(district.bounds) 
          : district.bounds;
        console.log(`${index + 1}. ${district.zoneCode}: ${district.name} | ${district.districtType} | Bounds: (${bounds.x1},${bounds.y1}) -> (${bounds.x2},${bounds.y2})`);
      });
    } else {
      console.log('⚠️ Hay un problema con el número de distritos');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para verificar solo sin hacer cambios
async function verifyOnly() {
  console.log('🔍 Solo verificando (sin cambios)...');
  
  const organization = await prisma.organization.findFirst();
  if (!organization) {
    console.log('❌ No hay organización');
    return;
  }

  const space = await prisma.space.findFirst({
    where: { organizationId: organization.id }
  });
  if (!space) {
    console.log('❌ No hay espacio');
    return;
  }

  const districts = await prisma.district.findMany({
    where: {
      organizationId: organization.id,
      spaceId: space.id
    },
    orderBy: { zoneCode: 'asc' }
  });

  console.log(`📊 Distritos encontrados: ${districts.length}`);
  districts.forEach((district, index) => {
    const bounds = typeof district.bounds === 'string' 
      ? JSON.parse(district.bounds) 
      : district.bounds;
    console.log(`${index + 1}. ${district.zoneCode}: ${district.name} | ${district.districtType} | Bounds: (${bounds.x1},${bounds.y1}) -> (${bounds.x2},${bounds.y2})`);
  });
}

// Ejecutar según argumentos
const command = process.argv[2];

if (command === 'verify-only') {
  verifyOnly();
} else {
  verifyAndFixDistricts();
}