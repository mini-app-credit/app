export abstract class ConnectionService<TAuthInput, TAuthOutput, TStateInput = void, TStateOutput = void> {
  abstract auth(input: TAuthInput): Promise<TAuthOutput>;

  // Optional for connectors that need a durable state store (oauth/install flows).
  loadState?(input: TStateInput): Promise<TStateOutput>;
}

