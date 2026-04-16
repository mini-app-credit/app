import { BaseValueObject } from 'src/shared';
import { ProviderNotSupportedError } from '../errors/iam.errors';

export const PROVIDER = {
  PASSWORD: 'password',
  GOOGLE: 'google',
} as const;

export const OAUTH_PROVIDERS = [PROVIDER.GOOGLE] as const;

export type ProviderPrimitive = (typeof PROVIDER)[keyof typeof PROVIDER];
export type OAuthProviderPrimitive = Exclude<ProviderPrimitive, 'password'>;

export class Provider extends BaseValueObject<ProviderPrimitive> {
  private constructor(value: ProviderPrimitive) {
    super(value);
  }

  protected validate(value: ProviderPrimitive): void {
    if (!Provider.isValid(value)) {
      throw new ProviderNotSupportedError(value);
    }
  }

  static create(provider: ProviderPrimitive): Provider {
    return new Provider(provider);
  }

  static password(): Provider {
    return new Provider(PROVIDER.PASSWORD);
  }

  static google(): Provider {
    return new Provider(PROVIDER.GOOGLE);
  }

  static oAuth(provider: OAuthProviderPrimitive): Provider {
    if (!OAUTH_PROVIDERS.includes(provider as OAuthProviderPrimitive)) {
      throw new ProviderNotSupportedError(provider);
    }

    return new Provider(provider);
  }

  private static isValid(provider: string): boolean {
    const validProviders: ProviderPrimitive[] = [...Object.values(PROVIDER)];
    return validProviders.includes(provider as ProviderPrimitive);
  }

  get asString(): ProviderPrimitive {
    return this.value;
  }

  equals(other: Provider): boolean {
    return this.value === other.value;
  }

  isPassword(): boolean {
    return this.value === 'password';
  }

  isOAuth(): boolean {
    return this.value !== 'password';
  }

  toString(): string {
    return this.value;
  }
}
