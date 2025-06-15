import mysql2 from "mysql2";

export const conexao = mysql2.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "studyflow"
}).promise()

export default conexao