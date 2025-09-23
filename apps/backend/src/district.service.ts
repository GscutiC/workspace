import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class DistrictService {
  constructor(private prisma: PrismaService) {}

  private transformDistrict(district: any) {
    return {
      ...district,
      bounds: typeof district.bounds === 'string' 
        ? JSON.parse(district.bounds) 
        : district.bounds,
    };
  }

  async findAll() {
    const districts = await this.prisma.district.findMany({
      include: {
        parcels: {
          select: {
            id: true,
            number: true,
            x: true,
            y: true,
            width: true,
            height: true,
            parcelType: true,
            status: true,
            currentPrice: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        zoneCode: 'asc',
      },
    });

    return districts.map(district => this.transformDistrict(district));
  }

  async findOne(id: string) {
    const district = await this.prisma.district.findUnique({
      where: { id },
      include: {
        parcels: true,
        organization: true,
        space: true,
      },
    });

    return district ? this.transformDistrict(district) : null;
  }

  async findByZoneCode(zoneCode: string) {
    const district = await this.prisma.district.findFirst({
      where: { zoneCode },
      include: {
        parcels: true,
      },
    });

    return district ? this.transformDistrict(district) : null;
  }

  async findByOrganizationAndSpace(organizationId: string, spaceId: string) {
    const districts = await this.prisma.district.findMany({
      where: {
        organizationId,
        spaceId,
      },
      include: {
        parcels: true,
      },
      orderBy: {
        zoneCode: 'asc',
      },
    });

    return districts.map(district => this.transformDistrict(district));
  }

  async getDistrictStats() {
    const totalDistricts = await this.prisma.district.count();
    const districtsByType = await this.prisma.district.groupBy({
      by: ['districtType'],
      _count: true,
    });

    const avgPriceByDistrict = await this.prisma.district.findMany({
      select: {
        id: true,
        name: true,
        zoneCode: true,
        districtType: true,
        basePriceMultiplier: true,
        parcels: {
          select: {
            currentPrice: true,
          },
        },
      },
    });

    const stats = avgPriceByDistrict.map((district) => {
      const totalPrice = district.parcels.reduce(
        (sum, parcel) => sum + (parcel.currentPrice || 0),
        0,
      );
      const avgPrice = district.parcels.length > 0 ? totalPrice / district.parcels.length : 0;

      return {
        id: district.id,
        name: district.name,
        zoneCode: district.zoneCode,
        districtType: district.districtType,
        basePriceMultiplier: district.basePriceMultiplier,
        parcelCount: district.parcels.length,
        avgPrice: Math.round(avgPrice),
        totalValue: Math.round(totalPrice),
      };
    });

    return {
      totalDistricts,
      districtsByType,
      stats,
    };
  }
}