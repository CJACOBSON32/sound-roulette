
import { defineConfig } from 'drizzle-kit';
import {environment} from "./src/utils/utils";

export const connectionString
    = `postgresql://${environment.databaseUsername}:${environment.databasePassword}@${environment.databaseUrl}/${environment.databaseName}`;

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: connectionString
    },
});