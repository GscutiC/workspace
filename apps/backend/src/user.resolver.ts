import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './graphql/models';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
class UpdateUserContactInput {
  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  organizationId?: string | null;

  @Field(() => Int, { nullable: true })
  totalPoints?: number | null;

  @Field(() => Int, { nullable: true })
  level?: number | null;

  @Field(() => Int, { nullable: true })
  streak?: number | null;
}

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.getAllUsers() as any;
  }

  @Query(() => User, { nullable: true })
  async userByClerkId(@Args('clerkId') clerkId: string): Promise<User | null> {
    return this.userService.findByClerkId(clerkId) as any;
  }

  @Query(() => User)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.userService.findById(id) as any;
  }

  @Mutation(() => User)
  async updateUserContact(
    @Args('clerkId') clerkId: string,
    @Args('input') input: UpdateUserContactInput,
  ): Promise<User> {
    const serviceInput = {
      firstName: input.firstName || undefined,
      lastName: input.lastName || undefined,
      phone: input.phone || undefined,
      address: input.address || undefined,
      organizationId: input.organizationId || undefined,
      totalPoints: input.totalPoints || undefined,
      level: input.level || undefined,
      streak: input.streak || undefined,
    };
    return this.userService.updateUserByClerkId(clerkId, serviceInput) as any;
  }
}
