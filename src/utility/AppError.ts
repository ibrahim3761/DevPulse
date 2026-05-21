class AppError extends Error {
  statusCode: number;
  success: boolean;
  detail?: string | undefined;

  constructor(message: string, statusCode: number, detail?: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = false; 
    this.detail = detail;
  }
}

export default AppError;

export interface ICatchError{
  message: string;
  statusCode: number;
  success: boolean;
  detail?: string | undefined;
}