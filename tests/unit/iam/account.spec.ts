import { UUIDIdentifier } from 'src/shared';
import { Account } from 'src/modules/iam/domain/entities/account.entity';
import { AccountSubject, Provider } from 'src/modules/iam/domain/value-objects';

describe('Account Entity', () => {
  const userId = UUIDIdentifier.generate();

  describe('Rule: Password Account Creation', () => {
    it('sets provider=password, verifiedAt=null', () => {
      const account = Account.createPassword({
        userId,
        subject: AccountSubject.fromEmail('test@example.com'),
      });

      expect(account.id).toBeDefined();
      expect(account.userId).toBe(userId);
      expect(account.provider.isPassword()).toBe(true);
      expect(account.verifiedAt).toBeNull();
      expect(account.isEmailVerified()).toBe(false);
    });
  });

  describe('Rule: OAuth Account Creation', () => {
    it('sets provider from input, verifiedAt=now', () => {
      const account = Account.createOAuth({
        userId,
        provider: Provider.google(),
        subject: AccountSubject.fromOAuthId('google-user-123'),
      });

      expect(account.provider.isOAuth()).toBe(true);
      expect(account.verifiedAt).not.toBeNull();
      expect(account.isEmailVerified()).toBe(true);
    });
  });

  describe('Rule: Email Verification', () => {
    it('markEmailVerified sets verifiedAt', () => {
      const account = Account.createPassword({
        userId,
        subject: AccountSubject.fromEmail('test@example.com'),
      });

      expect(account.isEmailVerified()).toBe(false);

      account.markEmailVerified();

      expect(account.isEmailVerified()).toBe(true);
      expect(account.verifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('Rule: Provider Check', () => {
    it('isPasswordProvider returns true for password accounts', () => {
      const account = Account.createPassword({
        userId,
        subject: AccountSubject.fromEmail('test@example.com'),
      });

      expect(account.isPasswordProvider()).toBe(true);
    });
  });
});
