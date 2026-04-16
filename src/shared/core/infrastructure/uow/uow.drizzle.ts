import { UnitOfWork } from "../../application";
import { BaseRepository } from "../../application/repositories";
import { AppRepositories } from "../../application/services/unit-of-work.service";
import { Database, PostgresTransaction } from "../drizzle";

export class UowDrizzle implements UnitOfWork {
  constructor(private readonly db: Database, private readonly repositories: AppRepositories) { }

  private bindRepositories(tx: PostgresTransaction): AppRepositories {
    const map: Record<string, BaseRepository<unknown>> = {};

    this.repositories.forEach((repository, key) => {
      map[key] = repository.bind(tx);
    });

    return new Map(Object.entries(map)) as AppRepositories;
  }

  withTransaction<T>(cb: (repos: AppRepositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const repos = this.bindRepositories(tx);
      return cb(repos);
    });
  }
}