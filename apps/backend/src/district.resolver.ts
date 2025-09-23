import { Resolver, Query, Args } from '@nestjs/graphql';
import { DistrictService } from './district.service';
import { District, DistrictStats } from './graphql/models';

@Resolver(() => District)
export class DistrictResolver {
  constructor(private readonly districtService: DistrictService) {}

  @Query(() => [District])
  async districts() {
    return this.districtService.findAll();
  }

  @Query(() => District, { nullable: true })
  async district(@Args('id') id: string) {
    return this.districtService.findOne(id);
  }

  @Query(() => District, { nullable: true })
  async districtByZone(@Args('zoneCode') zoneCode: string) {
    return this.districtService.findByZoneCode(zoneCode);
  }

  @Query(() => [District])
  async districtsBySpace(
    @Args('organizationId') organizationId: string,
    @Args('spaceId') spaceId: string,
  ) {
    return this.districtService.findByOrganizationAndSpace(organizationId, spaceId);
  }

  @Query(() => DistrictStats)
  async districtStats() {
    return this.districtService.getDistrictStats();
  }
}