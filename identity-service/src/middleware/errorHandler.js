import logger from "../utils/logger";

const errorHandler=(err,req,res,next)=>{
    logger.error(err.stack);
    res.status(res.statusCode || 500).json({
        message:err.message || "Internal Server Error"
    });
};

export default errorHandler;