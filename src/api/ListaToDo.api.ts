import { Router } from "express";
import { ListaToDoControle } from "../controle/ListaToDo.controle";
import { ListaToDoServico } from "../servico/ListaToDo.servico";

const router = Router();
const controle = new ListaToDoControle(new ListaToDoServico());

router.post("/", (req, res) => controle.adicionar(req, res));
router.get("/", (req, res) => controle.listar(req, res));
router.get("/:id", (req, res) => controle.buscar(req, res));
router.delete("/:id", (req, res) => controle.deletar(req, res));

export default router;