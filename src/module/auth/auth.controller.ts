import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";
import type { ICatchError } from "../../utility/AppError";

const signUp = async (req: Request, res: Response) => {
  try {
    const result = await authService.signUp(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: err.success,
      message: err.message,
      error: err.detail,
    });
  }
};
const logIn = async (req: Request, res: Response) => {
  try {
    const result = await authService.logIn(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: err.success,
      message: err.message,
      error: err.detail,
    });
  }
};

export const authController = {
  signUp,
  logIn,
};
