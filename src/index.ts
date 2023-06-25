import mysql from 'mysql2'
import mysqlPromise from 'mysql2/promise'

interface DB {
    Handle: mysql.Pool | null,
    Handle_Promise: mysqlPromise.Pool | null,
    Connect(options: DBConnectOptions, callback: Function): void,
    escape(string: string | number | object | Array<any>): string | number | null
}

export type DBConnectOptions = {
    connectionLimit?: number,
    host: string,
    user: string,
    password: string,
    database: string,
    connectTimeout?: number,
    multipleStatements?: boolean,
    debug?: boolean,
}

const DB: DB = {
    Handle: null,
    Handle_Promise: null,
    Connect: function(options: DBConnectOptions, callback: Function) {
        const defaultOptions: DBConnectOptions = {
            connectionLimit: 1000,
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'main',
            debug: false,
            connectTimeout: 10000,
            multipleStatements: true
        }
        options = Object.assign(defaultOptions, options)

        this.Handle = mysql.createPool(options)
        this.Handle.query('SET NAMES utf8mb4;');
        this.Handle.query('SET CHARACTER SET utf8mb4');
        this.Handle.query('SET COLLATION_CONNECTION="utf8mb4_general_ci"');
        this.Handle_Promise = this.Handle.promise()
        callback()
    },
    escape: function(string) {
        if (string == 'NULL') return string
        return mysql.escape(string)
    }
}

export default DB