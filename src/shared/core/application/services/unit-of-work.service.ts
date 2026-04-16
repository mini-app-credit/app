import { BaseRepository } from "../repositories";

export type AppRepositories = Map<string, BaseRepository<unknown>>;

export interface UnitOfWork {
  withTransaction<T>(cb: (repos: AppRepositories) => Promise<T>): Promise<T>;
}
