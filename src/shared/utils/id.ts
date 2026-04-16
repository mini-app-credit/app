import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from "nanoid";

export const uuid = () => uuidv4();

export const nanoid = customAlphabet('01232378321abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

