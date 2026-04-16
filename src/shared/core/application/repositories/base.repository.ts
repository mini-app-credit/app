import { PostgresTransaction } from "../../infrastructure";

 
export interface BaseRepository<T> {
  bind(tx: PostgresTransaction): BaseRepository<T>;
}