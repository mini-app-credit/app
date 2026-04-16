import { UserService } from "src/modules/iam/application/services/user.service";
import { UserResolverPort } from "../../application/services/user-resolve-port";
import { UUIDIdentifier } from "src/shared";

export class UserResolverAdapter implements UserResolverPort {
    constructor(private readonly userService: UserService) { }

    async getEmail(userId: string): Promise<string | null> {
        const user = await this.userService.getUser({ userId: UUIDIdentifier.create(userId) });
        const account = user.accounts.find(a => a.isPasswordProvider()) ?? user.accounts[0];
        return account?.subject.toString() ?? null;
    }
}