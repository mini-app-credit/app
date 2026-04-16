import { UUIDIdentifier } from 'src/shared';
import { User } from 'src/modules/iam/domain/aggregates/user.aggregate';
import { Account } from 'src/modules/iam/domain/entities/account.entity';
import { AccountSubject, Provider, AccountMeta } from 'src/modules/iam/domain/value-objects';
import { AccountAlreadyExistsError } from 'src/modules/iam/domain/errors/iam.errors';

describe('User Aggregate', () => {
  function createPasswordAccount(userId: UUIDIdentifier, email: string): Account {
    return Account.createPassword({
      userId,
      subject: AccountSubject.fromEmail(email),
    });
  }

  describe('Rule: Creation', () => {
    it('generates id, sets unitAmount and accounts', () => {
      const user = User.create({ unitAmount: 10000, accounts: [] });

      expect(user.id).toBeDefined();
      expect(user.unitAmount).toBe(10000);
      expect(user.accounts).toHaveLength(0);
    });
  });

  describe('Rule: Account Management', () => {
    it('addAccount adds account to array', () => {
      const user = User.create({ unitAmount: 10000, accounts: [] });
      const account = createPasswordAccount(user.id as UUIDIdentifier, 'test@example.com');

      user.addAccount(account);

      expect(user.accounts).toHaveLength(1);
    });

    it('addAccount throws AccountAlreadyExistsError for duplicate', () => {
      const user = User.create({ unitAmount: 10000, accounts: [] });
      const account = createPasswordAccount(user.id as UUIDIdentifier, 'test@example.com');

      user.addAccount(account);

      expect(() => user.addAccount(account)).toThrow(AccountAlreadyExistsError);
    });
  });

  describe('Rule: Credits', () => {
    it('updateCredits changes unitAmount', () => {
      const user = User.create({ unitAmount: 10000, accounts: [] });

      user.updateCredits(20000);

      expect(user.unitAmount).toBe(20000);
    });
  });
});
