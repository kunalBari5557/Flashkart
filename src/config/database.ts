import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
const sourceExtension = __filename.endsWith(".js") ? "js" : "ts";

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}

export const dataSource = new DataSource({
    type: "postgres",
    url: DATABASE_URL,
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    entities: [path.join(__dirname, `../entities/**/*.${sourceExtension}`)],
    migrations: [path.join(__dirname, `../../migrations/**/*.${sourceExtension}`)],
    subscribers: [],
    poolSize: 20,
    maxQueryExecutionTime: 5000,
});

export const initializeDatabase = async () => {
    try {
        await dataSource.initialize();
        console.log("✓ Database connection established");
    } catch (error) {
        console.error("✗ Database connection failed:", error);
        throw error;
    }
};
