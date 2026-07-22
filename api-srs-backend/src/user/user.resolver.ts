import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UpdateUserSettingsInput, User } from './models/user.model';
import { UserService } from './user.service';

export interface AuthUserPayload {
  id: string;
  email?: string;
  authId?: string;
}

@Resolver(() => User)
export class UserResolver {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getMe(@CurrentUser() user: AuthUserPayload): Promise<User> {
    // Agora o compilador sabe com 100% de certeza que user.id é uma string válida
    return this.userService.findById(user.id);
  }

  @Mutation(() => User, { name: 'updateMySettings' })
  @UseGuards(GqlAuthGuard)
  async updateMySettings(
    @CurrentUser() user: AuthUserPayload,
    @Args('data') data: UpdateUserSettingsInput,
  ): Promise<User> {
    return this.userService.updateSettings(user.id, data);
  }
}
