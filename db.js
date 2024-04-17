import mysql from "mysql";
import dotenv from "dotenv";
// dotenv config
dotenv.config();

let pool = "";
try {
    pool = new mysql.createPool({
        connectionLimit: 1000,
        host: process.env.db_host,
        port: process.env.db_port,
        user: process.env.db_user,
        password: process.env.db_password,
        database: process.env.database,
        dateStrings:true,
        connectTimeout: 15000,
        timeout:15000
    });
} catch (error) {
    console.log(error)
}

export { pool }