import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { nullable: true, name: 'me' })
  async getMe(@Args('authId') authId: string) {
    // Nota: Em uma etapa futura, o 'authId' virá do Token JWT via Guard,
    // e não como argumento explícito. Usamos o argumento agora para testes.
    return this.userService.findByAuthId(authId);
  }

  @Mutation(() => User, { name: 'syncIdentity' })
  async syncIdentity(
    @Args('authId') authId: string,
    @Args('email') email: string,
    @Args({ name: 'name', nullable: true }) name?: string,
  ) {
    return this.userService.syncUser(authId, email, name);
  }
}
