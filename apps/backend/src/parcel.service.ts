import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  Prisma,
  Parcel,
  ParcelType,
  ParcelStatus,
  BuildingType,
} from '@prisma/client';

// DTOs for Parcel operations
export interface CreateParcelDto {
  number: number;
  name?: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parcelType: ParcelType;
  status?: ParcelStatus;
  buildingType?: BuildingType;
  basePrice?: number;
  currentPrice?: number;
  monthlyTax?: number;
  ownerId?: string;
  organizationId: string;
  spaceId: string;
  mapConfig?: string;
  preset?: string;
}

export interface UpdateParcelDto {
  name?: string;
  description?: string;
  status?: ParcelStatus;
  buildingType?: BuildingType;
  basePrice?: number;
  currentPrice?: number;
  monthlyTax?: number;
  ownerId?: string;
}

export interface ParcelQueryDto {
  organizationId?: string;
  spaceId?: string;
  ownerId?: string;
  status?: ParcelStatus;
  parcelType?: ParcelType;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class ParcelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new parcel
   */
  async create(data: CreateParcelDto): Promise<Parcel> {
    // Check if parcel number already exists in the same space
    const existingParcel = await this.prisma.parcel.findFirst({
      where: {
        number: data.number,
        organizationId: data.organizationId,
        spaceId: data.spaceId,
      },
    });

    if (existingParcel) {
      throw new BadRequestException(
        `Parcel number ${data.number} already exists in this space`,
      );
    }

    return await this.prisma.parcel.create({
      data: {
        ...data,
        status: data.status || ParcelStatus.AVAILABLE,
        currentPrice: data.currentPrice || data.basePrice,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
    });
  }

  /**
   * Bulk create parcels (useful for map generation)
   */
  async createMany(parcels: CreateParcelDto[]): Promise<{ count: number }> {
    // Validate that all parcels have unique numbers within each space
    const numberSpaceMap = new Map<string, Set<number>>();

    for (const parcel of parcels) {
      const spaceKey = `${parcel.organizationId}-${parcel.spaceId}`;
      if (!numberSpaceMap.has(spaceKey)) {
        numberSpaceMap.set(spaceKey, new Set());
      }

      const numbers = numberSpaceMap.get(spaceKey)!;
      if (numbers.has(parcel.number)) {
        throw new BadRequestException(
          `Duplicate parcel number ${parcel.number} found in space ${parcel.spaceId}`,
        );
      }
      numbers.add(parcel.number);
    }

    const result = await this.prisma.parcel.createMany({
      data: parcels.map((parcel) => ({
        ...parcel,
        status: parcel.status || ParcelStatus.AVAILABLE,
        currentPrice: parcel.currentPrice || parcel.basePrice,
      })),
      skipDuplicates: true,
    });

    return result;
  }

  /**
   * Find all parcels with optional filtering
   */
  async findAll(query: ParcelQueryDto = {}): Promise<{
    parcels: Parcel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      organizationId,
      spaceId,
      ownerId,
      status,
      parcelType,
      priceMin,
      priceMax,
      page: pageParam = 1,
      limit: limitParam = 50,
    } = query;

    // Convert page and limit to numbers since they come as strings from query params
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : pageParam;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : limitParam;

    // Validate page and limit
    if (isNaN(page) || page < 1) {
      throw new Error('Page must be a positive integer');
    }
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      throw new Error('Limit must be a positive integer between 1 and 1000');
    }

    // Build where clause
    const where: Prisma.ParcelWhereInput = {};

    if (organizationId) where.organizationId = organizationId;
    if (spaceId) where.spaceId = spaceId;
    if (ownerId) where.ownerId = ownerId;
    if (status) where.status = status;
    if (parcelType) where.parcelType = parcelType;

    if (priceMin !== undefined || priceMax !== undefined) {
      where.currentPrice = {};
      if (priceMin !== undefined) where.currentPrice.gte = priceMin;
      if (priceMax !== undefined) where.currentPrice.lte = priceMax;
    }

    // Count total for pagination
    const total = await this.prisma.parcel.count({ where });

    // Get paginated results
    const parcels = await this.prisma.parcel.findMany({
      where,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: { number: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      parcels,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find parcel by ID
   */
  async findOne(id: string): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel with ID ${id} not found`);
    }

    return parcel;
  }

  /**
   * Find parcel by number in a specific space
   */
  async findByNumber(
    number: number,
    organizationId: string,
    spaceId: string,
  ): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        number,
        organizationId,
        spaceId,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcel number ${number} not found in space ${spaceId}`,
      );
    }

    return parcel;
  }

  /**
   * Update parcel
   */
  async update(id: string, data: UpdateParcelDto): Promise<Parcel> {
    // Check if parcel exists
    await this.findOne(id);

    return await this.prisma.parcel.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
    });
  }

  /**
   * Delete parcel
   */
  async remove(id: string): Promise<void> {
    // Check if parcel exists
    await this.findOne(id);

    await this.prisma.parcel.delete({
      where: { id },
    });
  }

  /**
   * Purchase parcel (assign owner and change status)
   */
  async purchase(
    id: string,
    ownerId: string,
    purchasePrice?: number,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id);

    if (parcel.status !== ParcelStatus.AVAILABLE) {
      throw new BadRequestException(
        `Parcel ${parcel.number} is not available for purchase`,
      );
    }

    return await this.prisma.parcel.update({
      where: { id },
      data: {
        ownerId,
        status: ParcelStatus.OWNED,
        currentPrice: purchasePrice || parcel.currentPrice,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        space: {
          select: { id: true, name: true, description: true },
        },
      },
    });
  }

  /**
   * Get parcels statistics for a space
   */
  async getSpaceStatistics(
    organizationId: string,
    spaceId: string,
  ): Promise<{
    total: number;
    available: number;
    owned: number;
    reserved: number;
    underConstruction: number;
    totalValue: number;
    averagePrice: number;
    parcelsByType: Record<ParcelType, number>;
  }> {
    const parcels = await this.prisma.parcel.findMany({
      where: { organizationId, spaceId },
    });

    const stats = {
      total: parcels.length,
      available: 0,
      owned: 0,
      reserved: 0,
      underConstruction: 0,
      totalValue: 0,
      averagePrice: 0,
      parcelsByType: {} as Record<ParcelType, number>,
    };

    // Initialize parcel type counters
    Object.values(ParcelType).forEach((type) => {
      stats.parcelsByType[type] = 0;
    });

    parcels.forEach((parcel) => {
      // Count by status
      switch (parcel.status) {
        case ParcelStatus.AVAILABLE:
          stats.available++;
          break;
        case ParcelStatus.OWNED:
          stats.owned++;
          break;
        case ParcelStatus.RESERVED:
          stats.reserved++;
          break;
        case ParcelStatus.UNDER_CONSTRUCTION:
          stats.underConstruction++;
          break;
      }

      // Count by type
      stats.parcelsByType[parcel.parcelType]++;

      // Add to total value
      if (parcel.currentPrice) {
        stats.totalValue += parcel.currentPrice;
      }
    });

    // Calculate average price
    if (stats.total > 0) {
      stats.averagePrice = stats.totalValue / stats.total;
    }

    return stats;
  }
}
