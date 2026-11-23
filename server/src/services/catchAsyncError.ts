import { Request, Response, NextFunction } from "express";

/** Postgres rejects an id that isn't a UUID; for the client that simply means "not found" */
export const isInvalidIdError = (err: unknown) =>
  !!err && typeof err === "object" && /invalid input syntax for type uuid/i.test(String((err as Error).message));

const catchAsyncError = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      if (res.headersSent) return;
      if (isInvalidIdError(err)) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
      res.status(500).json({ message: "Something went wrong" });
    });
  };
};

export default catchAsyncError;
