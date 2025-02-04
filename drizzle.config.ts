import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/lib/server/db/schema.ts",
    url: './data.db'
});