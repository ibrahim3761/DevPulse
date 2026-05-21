import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { User_role } from "../../types";

const router = Router()

router.post('/',auth(User_role.maintainer, User_role.contributor), issuesController.createIssue)


export const issuesRouter = router