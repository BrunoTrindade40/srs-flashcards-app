import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
// 🔴 CORREÇÃO CRÍTICA: Importação da CLASSE real, resolvendo o colapso do reflect-metadata.
import { UpdateUserSettingsInput, User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) { }

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<User> {
    return this.userService.findById(user.id);
  }

  @Mutation(() => User, { name: 'updateMySettings' })
  @UseGuards(GqlAuthGuard)
  async updateMySettings(
    @CurrentUser() user: User,
    @Args('data') data: UpdateUserSettingsInput,
  ): Promise<User> {
    return this.userService.updateSettings(user.id, data);
  }
}