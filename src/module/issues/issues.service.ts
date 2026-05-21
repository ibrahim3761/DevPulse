import AppError from "../../utility/AppError";
import dbQuery from "../../utility/queryHelpers";
import type { IIssue, IIssueQuery } from "./issues.interface";

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
  const issueResult = await dbQuery(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );

  if (issueResult.rowCount === 0) {
    throw new AppError("Issue not found", 404, "No issue exists with this ID");
  }

  const issue = issueResult.rows[0];

  // Fetch reporter info
  const reporterResult = await dbQuery(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
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
  console.log(result);
  return result;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB
};
