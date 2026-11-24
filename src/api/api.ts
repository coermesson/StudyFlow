
import express, {
    ErrorRequestHandler,
    Express,
    Request,
    RequestHandler,
    Response
} from "express";

import session from "express-session";
import { autenticar } from "../middleware/autenticacao";

export class Api {
    private constructor(readonly app: Express) { }

    public static build() {
        const app = express();

        // Permite a comunicação com o frontend React
        app.use((req, res, next) => {
            const origin = req.headers.origin;

            if (origin === "http://localhost:5173") {
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Credentials", "true");

                res.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                );

                res.setHeader(
                    "Access-Control-Allow-Headers",
                    "Content-Type"
                );

                res.setHeader("Vary", "Origin");
            }

            if (req.method === "OPTIONS") {
                res.sendStatus(204);
                return;
            }

            next();
        });

        app.use(express.json());

        const sessionSecret = process.env.SESSION_SECRET;

        if (!sessionSecret) {
            throw new Error("A variável de ambiente SESSION_SECRET é obrigatória");
        }

        app.use(session({
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            },
        }));

        return new Api(app);
    }

    
public configurarRotasFinais(): void {
    this.app.use((_req, res) => {
        res.status(404).json({ erro: "Rota não encontrada" });
    });

    const errorHandler: ErrorRequestHandler = (
        error,
        _req,
        res,
        _next
    ) => {
        const tiposDeErroDoParser = [
            "entity.parse.failed",
            "entity.verify.failed",
            "entity.too.large",
            "encoding.unsupported",
            "charset.unsupported",
            "request.size.invalid",
            "request.aborted",
        ];

        const tipo =
            typeof error === "object" &&
            error !== null &&
            "type" in error
                ? (error as { type?: unknown }).type
                : undefined;

        if (
            typeof tipo === "string" &&
            tiposDeErroDoParser.includes(tipo)
        ) {
            res.status(400).json({
                erro: "Requisição JSON inválida"
            });
            return;
        }

        console.error(
            "Falha inesperada na API",
            error instanceof Error ? error.name : "Erro desconhecido"
        );

        res.status(500).json({
            erro: "Erro interno do servidor"
        });
    };

    this.app.use(errorHandler);
}

public start(): void {
    this.configurarRotasFinais();

    this.app.listen(3000, () => {
        console.log("Server runing.");
    });
}


    public addRota(
        rota: string,
        metodo: string,
        funcao: (request: Request, response: Response) => void,
        publica = false,
        middlewares: RequestHandler[] = []
    ): void {
        const handlers = publica
            ? [...middlewares, funcao]
            : [autenticar, ...middlewares, funcao];

        if (metodo === "POST") {
            this.app.post(rota, ...handlers);
        } else if (metodo === "GET") {
            this.app.get(rota, ...handlers);
        } else if (metodo === "DELETE") {
            this.app.delete(rota, ...handlers);
        } else if (metodo === "PUT") {
            this.app.put(rota, ...handlers);
        } else if (metodo === "PATCH") {
            this.app.patch(rota, ...handlers);
        }
    }
}
