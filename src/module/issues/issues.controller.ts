import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import type { ICatchError } from "../../utility/AppError";
import { issuesService } from "./issues.service";

//All issue req&res handler
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getAllIssuesFromDB(
      req.query,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues fetched successfully",
      data: result,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail,
    });
  }
};

//Single issue get req&res handler
const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const {id} =req.params
    const result = await issuesService.getSingleIssueFromDB(id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue fetched successfully",
      data: result,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail,
    });
  }
};

// Create issue req&res handler
const createIssue = async (req: Request, res: Response) => {
  try {
    console.log(req.user.id);

    const result = await issuesService.createIssueIntoDB({
      ...req.body,
      reporter_id: req.user.id,
    });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail,
    });
  }
};

//Update issue req&res handler
const updateIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.updateIssueIntoDB(
      req.params.id as string,
      req.body,
      req.user.id as string,       
      req.user.role as string,     
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    const err = error as ICatchError;
    sendResponse(res, {
      statusCode: err.statusCode ?? 500,
      success: false,
      message: err.message ?? "Something went wrong",
      errors: err.detail,
    });
  }
};

// Delete issue req&res handler
const deleteIssue = async (req: Request, res: Response) => {
  try {
    const{id} = req.params
    await issuesService.deleteIssueFromDB(id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
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
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};
