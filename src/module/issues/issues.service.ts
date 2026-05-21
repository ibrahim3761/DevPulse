import dbQuery from "../../utility/queryHelpers";
import type { IIssue } from "./issues.interface"

const createIssueIntoDB = async (payload : IIssue) =>{
    const {title, description, type , reporter_id } = payload;
    const result = await dbQuery(
    `INSERT INTO issues(title, description, type, reporter_id)
     VALUES($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id]
  );
  console.log(result);
  return result;
}

export const issuesService = {
    createIssueIntoDB 
}