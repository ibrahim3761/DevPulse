import AppError from "../../utility/AppError";
import dbQuery from "../../utility/queryHelpers";
import type { IIsserUpdate, IIssue, IIssueQuery } from "./issues.interface";

// All issues get query
const getAllIssuesFromDB = async (query: IIssueQuery) => {
  const { sort = "newest", type, status } = query;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (type) {
    conditions.push(`type = $${index++}`);
    values.push(type);
  }

  if (status) {
    conditions.push(`status = $${index++}`);
    values.push(status);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const orderClause =
    sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  // Fetch all issues
  const issuesResult = await dbQuery(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    values,
  );

  const issues = issuesResult.rows;
  if (issues.length === 0) return [];

  // Fetch reporter info for each issue
  const result = await Promise.all(
    issues.map(async (issue) => {
      const reporterResult = await dbQuery(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [issue.reporter_id],
      );
      const reporter = reporterResult.rows[0];
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    }),
  );

  return result;
};

//Single issue get query
const getSingleIssueFromDB = async (id: string) => {
  // Fetch issue
  const issueResult = await dbQuery(`SELECT * FROM issues WHERE id = $1`, [id]);

  if (issueResult.rowCount === 0) {
    throw new AppError("Issue not found", 404, "No issue exists with this ID");
  }

  const issue = issueResult.rows[0];

  // Fetch reporter info
  const reporterResult = await dbQuery(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0];

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

// Issue create query
const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, reporter_id } = payload;
  const result = await dbQuery(
    `INSERT INTO issues(title, description, type, reporter_id)
     VALUES($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id],
  );
  return result;
};

//Update issue query
const updateIssueIntoDB = async (
  id: string,
  payload: IIsserUpdate,
  userId: string,
  userRole: string,
) => {
  // Check issue exists
  const isIssueExist = await dbQuery(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (isIssueExist.rowCount === 0) {
    throw new AppError("Issue not found", 404, "No issue exists with this ID");
  }

  const issue = isIssueExist.rows[0];
  
  const { title, description, type, status } = payload;

  //Check permissions for contributor
  if (userRole === "contributor") {
    // Contributor can only update their own issue
    if (issue.reporter_id !== userId) {
      throw new AppError(
        "Forbidden",
        403,
        "You can only update your own issues",
      );
    }
    //Only maintainer can update status
    if (status) {
      throw new AppError(
        "Forbidden",
        403,
        "You are not allowed to update issue status",
      );
    }
    // Contributor can only update if status is open
    if (issue.status !== "open") {
      throw new AppError(
        "Forbidden",
        403,
        "You can only update issues that are open",
      );
    }
    
  }


  // Update issue
  const result = await dbQuery(
    `UPDATE issues 
     SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       status = COALESCE($4,status),
       updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [title, description, type, status, id],
  );

  return result.rows[0];
};

//Delete issue query
const deleteIssueFromDB = async (id: string) => {
  //Check if issue exitst
  const isIssueExist = await dbQuery(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (isIssueExist.rowCount === 0) {
    throw new AppError("Issue not found", 404, "No issue exists with this ID");
  }
  //Delete issue
  await dbQuery(`DELETE FROM issues WHERE id = $1`, [id]);
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};
