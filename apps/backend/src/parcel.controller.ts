import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelGeneratorService } from './parcel-generator.service';
import type {
  CreateParcelDto,
  UpdateParcelDto,
  ParcelQueryDto,
} from './parcel.service';
import { ParcelType, ParcelStatus, BuildingType } from '@prisma/client';

@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly parcelGeneratorService: ParcelGeneratorService,
  ) {}

  /**
   * Create a new parcel
   * POST /parcels
   */
  @Post()
  async create(@Body() createParcelDto: CreateParcelDto) {
    return await this.parcelService.create(createParcelDto);
  }

  /**
   * Bulk create parcels (useful for map generation)
   * POST /parcels/bulk
   */
  @Post('bulk')
  async createMany(@Body() parcels: CreateParcelDto[]) {
    return await this.parcelService.createMany(parcels);
  }

  /**
   * Get all parcels with filtering
   * GET /parcels
   */
  @Get()
  async findAll(@Query() query: ParcelQueryDto) {
    return await this.parcelService.findAll(query);
  }

  /**
   * Get parcel by ID
   * GET /parcels/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.parcelService.findOne(id);
  }

  /**
   * Get parcel by number in specific space
   * GET /parcels/by-number/:organizationId/:spaceId/:number
   */
  @Get('by-number/:organizationId/:spaceId/:number')
  async findByNumber(
    @Param('organizationId') organizationId: string,
    @Param('spaceId') spaceId: string,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return await this.parcelService.findByNumber(
      number,
      organizationId,
      spaceId,
    );
  }

  /**
   * Update parcel
   * PUT /parcels/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateParcelDto: UpdateParcelDto,
  ) {
    return await this.parcelService.update(id, updateParcelDto);
  }

  /**
   * Delete parcel
   * DELETE /parcels/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.parcelService.remove(id);
  }

  /**
   * Purchase parcel
   * POST /parcels/:id/purchase
   */
  @Post(':id/purchase')
  async purchase(
    @Param('id') id: string,
    @Body() purchaseData: { ownerId: string; purchasePrice?: number },
  ) {
    return await this.parcelService.purchase(
      id,
      purchaseData.ownerId,
      purchaseData.purchasePrice,
    );
  }

  /**
   * Get space statistics
   * GET /parcels/statistics/:organizationId/:spaceId
   */
  @Get('statistics/:organizationId/:spaceId')
  async getSpaceStatistics(
    @Param('organizationId') organizationId: string,
    @Param('spaceId') spaceId: string,
  ) {
    return await this.parcelService.getSpaceStatistics(organizationId, spaceId);
  }

  /**
   * Get available parcel types (enum values)
   * GET /parcels/enums/types
   */
  @Get('enums/types')
  getParcelTypes() {
    return {
      parcelTypes: Object.values(ParcelType),
      parcelStatuses: Object.values(ParcelStatus),
      buildingTypes: Object.values(BuildingType),
    };
  }

  /**
   * Generate demo parcels for a space
   * POST /parcels/generate/demo/:organizationId/:spaceId
   */
  @Post('generate/demo/:organizationId/:spaceId')
  async generateDemoParcels(
    @Param('organizationId') organizationId: string,
    @Param('spaceId') spaceId: string,
  ) {
    return await this.parcelGeneratorService.generateDemoParcels(
      organizationId,
      spaceId,
    );
  }

  /**
   * Generate custom grid of parcels
   * POST /parcels/generate/grid/:organizationId/:spaceId
   */
  @Post('generate/grid/:organizationId/:spaceId')
  async generateParcelGrid(
    @Param('organizationId') organizationId: string,
    @Param('spaceId') spaceId: string,
    @Body()
    gridConfig: {
      width?: number;
      height?: number;
      parcelSize?: number;
    },
  ) {
    const { width = 20, height = 15, parcelSize = 32 } = gridConfig;
    return await this.parcelGeneratorService.generateParcelsGrid(
      organizationId,
      spaceId,
      width,
      height,
      parcelSize,
    );
  }

  /**
   * Clear all parcels in a space
   * DELETE /parcels/clear/:organizationId/:spaceId
   */
  @Delete('clear/:organizationId/:spaceId')
  async clearParcels(
    @Param('organizationId') organizationId: string,
    @Param('spaceId') spaceId: string,
  ) {
    const deletedCount = await this.parcelGeneratorService.clearAllParcels(
      organizationId,
      spaceId,
    );
    return { deleted: deletedCount };
  }
}
