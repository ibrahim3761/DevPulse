import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { User_role } from "../../types";

const router = Router()
// All issues get route
router.get("/", issuesController.getAllIssues); 
// Single issue get route
router.get("/:id", issuesController.getSingleIssue);
// Issue craete route
router.post('/',auth(User_role.maintainer, User_role.contributor), issuesController.createIssue)
// Issue update roue
router.patch("/:id",auth(User_role.maintainer, User_role.contributor), issuesController.updateIssue)
// Issue delete route
router.delete("/:id", auth(User_role.maintainer), issuesController.deleteIssue)



export const issuesRouter = router