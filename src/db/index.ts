import { drizzle } from 'drizzle-orm/node-postgres';
import {environment} from "@/utils/utils";
import * as schema from './schema';
import {Pool} from "pg";

const connectionString
    = `postgresql://${environment.databaseUsername}:${environment.databasePassword}@${environment.databaseUrl}/${environment.databaseName}`;

const pool = new Pool({ connectionString });
export const db = drizzle(pool, {schema});