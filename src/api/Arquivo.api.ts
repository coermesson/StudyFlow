import { ArquivoController } from "../controle/Arquivo.controle";
import { ArquivoDao } from "../dao/Arquivo.dao";
import { ArquivoServico } from "../servico/arquivo.servico";
import multer, { MulterError } from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { RequestHandler } from "express";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";
import { Api } from "./api";

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
            void arquivoArmazenamento.diretorioTemporarioUpload()
                .then((diretorio) => callback(null, diretorio))
                .catch((error: Error) => callback(error, ""));
        },
        filename: (_req, _file, callback) => callback(null, `${randomUUID()}.upload`),
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        const extensao = path.extname(file.originalname).toLowerCase();
        if (extensao !== ".pdf" || file.mimetype.toLowerCase() !== "application/pdf") {
            callback(Object.assign(new Error("Formato de arquivo inválido"), { code: "UPLOAD_INVALID_TYPE" }));
            return;
        }
        callback(null, true);
    },
});

const receberArquivo: RequestHandler = (req, res, next) => {
    upload.single("arquivo")(req, res, (error?: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({ erro: "Arquivo excede o limite de 10 MB" });
            return;
        }
        const code = typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;
        if (error instanceof MulterError || code === "UPLOAD_INVALID_TYPE") {
            res.status(400).json({ erro: "Envie um arquivo PDF no campo arquivo" });
            return;
        }

        console.error("Falha ao receber arquivo", error instanceof Error ? error.name : "Erro desconhecido");
        res.status(500).json({ erro: "Erro interno do servidor" });
    });
};

export class ArquivoApi {
    readonly arquivoControle: ArquivoController;

    private constructor(readonly api: Api) {
        this.arquivoControle = new ArquivoController(new ArquivoServico(new ArquivoDao()));
    }

    public static build(api: Api) {
        const arquivoApi = new ArquivoApi(api);
        arquivoApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/arquivos", "POST", this.arquivoControle.salvar.bind(this.arquivoControle), false, [receberArquivo]);
        this.api.addRota("/arquivos", "GET", this.arquivoControle.listar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "GET", this.arquivoControle.buscar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id/download", "GET", this.arquivoControle.baixar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "PUT", this.arquivoControle.atualizar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "DELETE", this.arquivoControle.deletar.bind(this.arquivoControle));
    }
}
