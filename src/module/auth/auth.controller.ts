import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

const signUp = async (req: Request, res: Response) => {
  try {
    const result = await authService.signUp(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows,
    });
  } catch (error: any) {
    sendResponse(res, {
     statusCode: error.statusCode ?? 500,
      success: error.success,
      message: error.message,
      error: error.detail,
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
  } catch (error: any) {
    sendResponse(res, {
      statusCode: error.statusCode ?? 500,
      success: error.success,
      message: error.message,
      error: error.detail,
    });
  }
};

export const authController = {
  signUp,
  logIn,
};
