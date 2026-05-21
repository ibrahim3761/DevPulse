
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


// src/app.ts
import express from "express";

// src/module/auth/auth.route.ts
import { Router } from "express";

// src/module/auth/auth.service.ts
import bcrypt from "bcrypt";

// src/utility/AppError.ts
var AppError = class extends Error {
  statusCode;
  success;
  detail;
  constructor(message, statusCode, detail) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.detail = detail;
  }
};
var AppError_default = AppError;

// src/module/auth/auth.service.ts
import jwt from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret_key: process.env.SECRET_KEY,
  refresh_secret_key: process.env.REFRESH_SECRET_KEY
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(100) DEFAULT 'contributor' 
                CHECK (role IN ('contributor', 'maintainer')),
                
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL
                CHECK (LENGTH(description) >= 20),

            type VARCHAR(20) NOT NULL
                CHECK (type IN ('bug', 'feature_request')),

            status VARCHAR(20) DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),

            reporter_id INT REFERENCES users(id) ON DELETE CASCADE,

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `);
    console.log("Successful");
  } catch (error) {
    console.error("DB Init Error:", error);
    throw new Error("Failed to connect to the database");
  }
};

// src/utility/queryHelpers.ts
var dbQuery = async (query, values) => {
  return await pool.query(query, values);
};
var queryHelpers_default = dbQuery;

// src/module/auth/auth.service.ts
var signUp = async (payload) => {
  const { email, password, name, role } = payload;
  if (!name || !email || !password) {
    throw new AppError_default(
      "Bad Request",
      400,
      "Name, email and password are required"
    );
  }
  const existingUser = await queryHelpers_default(`SELECT id FROM users WHERE email = $1`, [
    email
  ]);
  if (existingUser.rowCount > 0) {
    throw new AppError_default(
      "User already exists",
      409,
      "An account with this email is already registered"
    );
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await queryHelpers_default(
    `INSERT INTO users(name,email,password,role)
       VALUES($1,$2,$3, COALESCE($4,'contributor'))
       RETURNING *
      `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var logIn = async (payload) => {
  const { email, password } = payload;
  const userData = await queryHelpers_default(`SELECT * FROM users WHERE email = $1`, [
    email
  ]);
  if (userData.rowCount === 0) {
    throw new AppError_default("User not found", 404, "No user exists with this email");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new AppError_default(
      "Invalid password",
      401,
      "The password you entered is incorrect"
    );
  }
  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secret_key, {
    expiresIn: "2d"
  });
  delete user.password;
  return { token, user };
};
var authService = {
  signUp,
  logIn
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.errors
  });
};
var sendResponse_default = sendResponse;

// src/module/auth/auth.controller.ts
var signUp2 = async (req, res) => {
  try {
    const result = await authService.signUp(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var logIn2 = async (req, res) => {
  try {
    const result = await authService.logIn(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var authController = {
  signUp: signUp2,
  logIn: logIn2
};

// src/module/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUp);
router.post("/login", authController.logIn);
var authRoute = router;

// src/module/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/module/issues/issues.service.ts
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  const conditions = [];
  const values = [];
  let index = 1;
  if (type) {
    conditions.push(`type = $${index++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${index++}`);
    values.push(status);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
  const issuesResult = await queryHelpers_default(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    values
  );
  const issues = issuesResult.rows;
  if (issues.length === 0) return [];
  const result = await Promise.all(
    issues.map(async (issue) => {
      const reporterResult = await queryHelpers_default(
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
        updated_at: issue.updated_at
      };
    })
  );
  return result;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await queryHelpers_default(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueResult.rowCount === 0) {
    throw new AppError_default("Issue not found", 404, "No issue exists with this ID");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await queryHelpers_default(
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
    updated_at: issue.updated_at
  };
};
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await queryHelpers_default(
    `INSERT INTO issues(title, description, type, reporter_id)
     VALUES($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id]
  );
  return result;
};
var updateIssueIntoDB = async (id, payload, userId, userRole) => {
  const isIssueExist = await queryHelpers_default(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (isIssueExist.rowCount === 0) {
    throw new AppError_default("Issue not found", 404, "No issue exists with this ID");
  }
  const issue = isIssueExist.rows[0];
  const { title, description, type, status } = payload;
  if (userRole === "contributor") {
    if (issue.reporter_id !== userId) {
      throw new AppError_default(
        "Forbidden",
        403,
        "You can only update your own issues"
      );
    }
    if (status) {
      throw new AppError_default(
        "Forbidden",
        403,
        "You are not allowed to update issue status"
      );
    }
    if (issue.status !== "open") {
      throw new AppError_default(
        "Forbidden",
        403,
        "You can only update issues that are open"
      );
    }
  }
  const result = await queryHelpers_default(
    `UPDATE issues 
     SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       status = COALESCE($4,status),
       updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [title, description, type, status, id]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const isIssueExist = await queryHelpers_default(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (isIssueExist.rowCount === 0) {
    throw new AppError_default("Issue not found", 404, "No issue exists with this ID");
  }
  await queryHelpers_default(`DELETE FROM issues WHERE id = $1`, [id]);
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/module/issues/issues.controller.ts
var getAllIssues = async (req, res) => {
  try {
    const result = await issuesService.getAllIssuesFromDB(
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues fetched successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getSingleIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue fetched successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var createIssue = async (req, res) => {
  try {
    console.log(req.user.id);
    const result = await issuesService.createIssueIntoDB({
      ...req.body,
      reporter_id: req.user.id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issuesService.updateIssueIntoDB(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    await issuesService.deleteIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access",
          errors: "No token provided"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret_key
      );
      const userData = await queryHelpers_default(`SELECT * FROM users WHERE email = $1`, [
        decoded.email
      ]);
      const user = userData.rows[0];
      if (userData.rowCount === 0) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "User not found",
          errors: "No user exists with this token"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden",
          errors: "You do not have permission to access this resource"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      const err = error;
      sendResponse_default(res, {
        statusCode: err.statusCode ?? 500,
        success: err.success,
        message: err.message ?? "Something went wrong",
        errors: err.detail
      });
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var User_role = {
  "maintainer": "maintainer",
  "contributor": "contributor"
};

// src/module/issues/issues.route.ts
var router2 = Router2();
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.post("/", auth_default(User_role.maintainer, User_role.contributor), issuesController.createIssue);
router2.patch("/:id", auth_default(User_role.maintainer, User_role.contributor), issuesController.updateIssue);
router2.delete("/:id", auth_default(User_role.maintainer), issuesController.deleteIssue);
var issuesRouter = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
var app_default = app;

// src/server.ts
var port = process.env.PORT;
var main = () => {
  initDB();
  app_default.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map