import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import type { ICatchError } from "../../utility/AppError";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    console.log(req.user.id);
    
    const result = await issuesService.createIssueIntoDB({...req.body , reporter_id: req.user.id,});
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows,
    });
  } 
  catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail,
    });
  }
};

export const issuesController = {
  createIssue,
};
