import dbQuery from "../../utility/queryHelpers";
import type { IIssue, IIssueQuery } from "./issues.interface";

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

  // Step 1: fetch all issues
  const issuesResult = await dbQuery(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    values,
  );

  const issues = issuesResult.rows;
  if (issues.length === 0) return [];

  // Step 2: fetch reporter for each issue in a separate query
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
};
