import { EventPayloadAdaptersRegistry } from 'src/modules/notifications/infrastructure/services/event-payload-adapters.registry';

describe('EventPayloadAdaptersRegistry', () => {
  const registry = new EventPayloadAdaptersRegistry();

  it('adapts sign-up event: extracts userName from email', () => {
    const result = registry.adapt('event.iam.user:sign-up', {
      userId: 'u1',
      email: 'ada@example.com',
      provider: 'password',
      createdAt: '2026-04-11T00:00:00.000Z',
    });

    expect(result).toEqual({ userName: 'ada' });
  });

  it('falls back to raw payload for unknown event', () => {
    const payload = { foo: 'bar', baz: 42 };
    const result = registry.adapt('event.some.unknown:thing', payload);
    expect(result).toBe(payload);
  });

  it('returns fallback userName when email is missing', () => {
    const result = registry.adapt('event.iam.user:sign-up', { userId: 'u1' });
    expect(result).toEqual({ userName: 'there' });
  });

  it('uses full value when email has no @ character', () => {
    const result = registry.adapt('event.iam.user:sign-up', { email: 'noemail' });
    expect(result).toEqual({ userName: 'noemail' });
  });
});
