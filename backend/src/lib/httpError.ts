export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFound = () => new ApiError(404, 'Not found');
export const forbidden = () => new ApiError(403, 'Forbidden');
