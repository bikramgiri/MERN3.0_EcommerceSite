import {Request, Response, NextFunction} from 'express';

const catchAsyncError = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch((err: Error) => {
            return res.status(500).json({
                message: 'Something went wrong'
            });
        });
    };
}

export default catchAsyncError;