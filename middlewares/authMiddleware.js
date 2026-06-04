//import dependencies
const jwt = require('jsonwebtoken');

//authMiddleware
const authMiddleware = (req, res, next) => {
    try{

        /*const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                status: 1,
                message: "Token Required"
            })
        }
        const token = authHeader.split(" ")[1];*/

         //get token
        const token = req.cookies.token;

        //validate token
        if(!token){
            //display
            return res.status(401).json({
                status: 401,
                errorMessage: "Unauthorized"
            })
        }

        /*//get token
        const token = req.cookies.token;

        //validate token
        if(!token){
            //display
            return res.status(401).json({
                status: 401,
                errorMessage: "Unauthorized"
            })
        }*/

        //check jwt
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        )
        //save user in request
        req.user = decoded;
        next();

    }catch(error){
        console.error(error)
        return res.status(401).json({
            status: 401,
            errorMessage: error
        })
    }
}

module.exports = {
    authMiddleware
}