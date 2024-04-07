import mysql from 'mysql2'
import mysqlPromise, { FieldPacket, RowDataPacket } from 'mysql2/promise'

interface DB {
    Handle: mysql.Pool,
    Handle_Promise: mysqlPromise.Pool,
    Connect(callback: Function): void,
    escape(string: string | number | object | Array<any>): string | number | null,
    onConnect(callback: Function): void,
    getTableFields(tableName: string): Promise<RowDataPacket[]>,
    makeFromStringForTable(tableName: string, tableAlias?: string): Promise<string>
}

const waitingForConnection: Function[] = []

const DB: DB = {
    // @ts-expect-error
    Handle: null,
    // @ts-expect-error
    Handle_Promise: null,
    Connect: function(callback: Function) {
        this.Handle = mysql.createPool({
            connectionLimit: 1000,
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'main',
            debug: false,
            connectTimeout: 10000,
            multipleStatements: true
        })
        this.Handle.query('SET NAMES utf8mb4;');
        this.Handle.query('SET CHARACTER SET utf8mb4');
        this.Handle.query('SET COLLATION_CONNECTION="utf8mb4_general_ci"');
        this.Handle_Promise = this.Handle.promise()
        callback()
        for (const waitingCallback of waitingForConnection) {
            waitingCallback()
        }
        waitingForConnection.length = 0
    },
    escape: function(string) {
        if (string == 'NULL') return string
        return mysql.escape(string)
    },
    onConnect: function(callback: Function) {
        if (this.Handle) return callback()
        waitingForConnection.push(callback)
    },
    async getTableFields(tableName: string) {
        const [ thisTableFields ]: [RowDataPacket[], FieldPacket[]] = await DB.Handle_Promise.query(`SHOW COLUMNS FROM ${tableName}`);
        return thisTableFields;
    },
    async makeFromStringForTable(tableName: string, tableAlias?: string) {
        if (!tableAlias) tableAlias = tableName;
        const thisTableFields = await DB.getTableFields(tableName);
        const thisTableFieldsString = thisTableFields.map((field: RowDataPacket) => {
            const thisField = field as any;
            return `${tableAlias}.${thisField.Field} AS \`${tableName}:${thisField.Field}\``
        })

        return thisTableFieldsString.join(', ');
    }
}

export default DB