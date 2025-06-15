import { Router } from "express";
import { ItemToDoControle } from "../controle/ItemToDo.controle";
import { ItemToDoServico } from "../servico/ItemToDo.servico";
const router = Router();
const controle = new ItemToDoControle(new ItemToDoServico());

router.post("/", (req, res) => controle.adicionar(req, res));
router.get("/", (req, res) => controle.listar(req, res));
router.get("/:id", (req, res) => controle.buscar(req, res));
router.delete("/:id", (req, res) => controle.deletar(req, res));

export default router;