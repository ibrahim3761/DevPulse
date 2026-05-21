import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utility/sendResponse";
import type { ICatchError } from "../utility/AppError";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import dbQuery from "../utility/queryHelpers";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access",
          errors: "No token provided",
        });
      }

      // Verify token and extract user information
      const decoded = jwt.verify(
        token as string,
        config.secret_key,
      ) as JwtPayload;

      // Check if user exists
      const userData = await dbQuery(`SELECT * FROM users WHERE email = $1`, [
        decoded.email,
      ]);

      const user = userData.rows[0];

      if (userData.rowCount === 0) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "User not found",
          errors: "No user exists with this token",
        });
      }

      // Check if user has the required role
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden",
          errors: "You do not have permission to access this resource",
        });
      }

      req.user = decoded;
      next();

    } 
    catch (error) {
      const err = error as ICatchError;
      sendResponse(res, {
        statusCode: err.statusCode ?? 500,
        success: err.success,
        message: err.message ?? "Something went wrong",
        errors: err.detail,
      });
    }
  };
};


export default auth;