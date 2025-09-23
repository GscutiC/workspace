import { Injectable } from '@nestjs/common';
import { ParcelService, CreateParcelDto } from './parcel.service';
import { ParcelType, ParcelStatus, BuildingType } from '@prisma/client';

@Injectable()
export class ParcelGeneratorService {
  constructor(private parcelService: ParcelService) {}

  /**
   * Generate a grid of parcels for a space
   */
  async generateParcelsGrid(
    organizationId: string,
    spaceId: string,
    gridWidth: number = 20,
    gridHeight: number = 15,
    parcelSize: number = 32
  ): Promise<{ created: number; skipped: number }> {
    const parcels: CreateParcelDto[] = [];
    let parcelNumber = 1;

    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const parcel: CreateParcelDto = {
          number: parcelNumber,
          name: `Parcela ${parcelNumber}`,
          description: `Parcela residencial ${parcelNumber} - Posición (${col}, ${row})`,
          x: col * parcelSize,
          y: row * parcelSize,
          width: parcelSize,
          height: parcelSize,
          parcelType: this.getRandomParcelType(),
          status: ParcelStatus.AVAILABLE,
          buildingType: this.getRandomBuildingType(),
          basePrice: this.calculatePrice(row, col, gridWidth, gridHeight),
          currentPrice: undefined, // Will be set to basePrice by service
          monthlyTax: this.calculateTax(row, col),
          organizationId,
          spaceId,
        };

        parcels.push(parcel);
        parcelNumber++;
      }
    }

    try {
      const result = await this.parcelService.createMany(parcels);
      return {
        created: result.count,
        skipped: parcels.length - result.count,
      };
    } catch (error) {
      console.error('Error creating parcels:', error);
      throw error;
    }
  }

  /**
   * Generate parcels for demo purposes with realistic data
   */
  async generateDemoParcels(
    organizationId: string,
    spaceId: string
  ): Promise<{ created: number; skipped: number }> {
    // Create a smaller demo grid (10x8 = 80 parcels)
    return this.generateParcelsGrid(organizationId, spaceId, 10, 8, 32);
  }

  private getRandomParcelType(): ParcelType {
    const types = Object.values(ParcelType);
    const weights = {
      [ParcelType.RESIDENTIAL]: 0.6, // 60% residential
      [ParcelType.COMMERCIAL]: 0.25, // 25% commercial
      [ParcelType.INDUSTRIAL]: 0.1,  // 10% industrial
      [ParcelType.MIXED_USE]: 0.05,  // 5% mixed use
    };

    const random = Math.random();
    let cumulative = 0;

    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return type as ParcelType;
      }
    }

    return ParcelType.RESIDENTIAL; // fallback
  }

  private getRandomBuildingType(): BuildingType {
    const types = Object.values(BuildingType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private calculatePrice(row: number, col: number, maxWidth: number, maxHeight: number): number {
    // Center parcels are more expensive
    const centerX = maxWidth / 2;
    const centerY = maxHeight / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2)
    );
    const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
    const normalizedDistance = distanceFromCenter / maxDistance;

    // Base price decreases with distance from center
    const basePrice = 50000; // $50,000 base
    const maxPrice = 200000; // $200,000 max
    const price = maxPrice - (normalizedDistance * (maxPrice - basePrice));

    // Add some randomness ±20%
    const randomFactor = 0.8 + (Math.random() * 0.4);
    return Math.round(price * randomFactor);
  }

  private calculateTax(row: number, col: number): number {
    // Tax between $100-$500 per month
    const baseTax = 100;
    const maxTax = 500;
    const random = Math.random();
    return Math.round(baseTax + (random * (maxTax - baseTax)));
  }

  /**
   * Clear all parcels (useful for testing)
   */
  async clearAllParcels(organizationId: string, spaceId: string): Promise<number> {
    const { parcels } = await this.parcelService.findAll({
      organizationId,
      spaceId,
      limit: 1000,
    });

    let deletedCount = 0;
    for (const parcel of parcels) {
      await this.parcelService.remove(parcel.id);
      deletedCount++;
    }

    return deletedCount;
  }
}