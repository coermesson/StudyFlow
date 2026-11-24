import { NextFunction, Request, Response } from "express";

type SessaoComUsuario = Request["session"] & { usuarioId?: string };

export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const usuarioId = (req.session as SessaoComUsuario | undefined)?.usuarioId;
  if (!usuarioId) {
    res.status(401).json({ erro: "Autenticação necessária" });
    return;
  }

  res.locals.usuarioId = usuarioId;
  next();
}
