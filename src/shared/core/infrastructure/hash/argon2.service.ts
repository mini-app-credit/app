import { HashService } from "../../application";
import * as argon2 from 'argon2';

export class Argon2HashService implements HashService {
  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 65536,
    });
  }
  async verify(plaintext: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plaintext);
  }
}