import { Response } from "express"

const sendResponse = (res:Response, statusNumber:number, message:string, field: string|null = null, data: any[]|null = null, token: string|null=null)=>{
    res.status(statusNumber).json({
        message, 
      //   field: field ? field : null,
       field: field ?? null,
        data : Array.isArray(data) && data.length > 0 ? data : null,
        token : token ?? null
    })
    
}

export default sendResponse