//import dependencies
const bcrypt = require('bcrypt');//password
const jwt = require('jsonwebtoken');//token for login
const {msnodesqlv8} = require('../config/db')

const { error} = require("node:console")

// Add User
const registerUser = async (req,res) => {
    try{
        // Get data from BODY
        const { username, password } = req.body;

        // validate data
        if (!username || !password ) {

            // display
            return res.status(400).json({
                status: 400,
                errorMessage: "Empty fields, all fields are required."
            });
        }
        // Check if email already exists
        const existingUser = await msnodesqlv8.query`
            Select * From Users Where Username = ${username}
        `;

        if (existingUser.recordset.length > 0) {

            // Conflict
            return res.status(409).json({
                status: 409,
                errorMessage: "Username already exists."
            });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        //INsert user
        await msnodesqlv8.query `
            Insert Into Users (Username, PasswordHash) Values (${username}, ${hashedPassword})
        `;

        //Response
        //status = 201 Created
        res.status(201).json({
            status: 201,
            message:"Inserted succesfully"
        });

    } catch(error){
        console.error(error);

        res.status(500).json({
            status: 500,
            message:"Internal server error"
        })
    }
}

const getAllUser = async (req, res) => {
    try{
        // Check if email already exists
        const userList = await msnodesqlv8.query`
            Select * From Users ORDER BY ID
        `;

        if (userList.recordset.length < 0) {
            // Conflict
            return res.status(409).json({
                status: 409,
                errorMessage: "No users"
            });
        }

        //Response
        //status = 201 Created
        res.status(200).json({
            status: 200,
            message:"Success",
            data: userList.recordset
        });

    } catch(error){
        console.error(error);

        res.status(500).json({
            status: 500,
            message:"Internal server error"
        })
    }
}

const getUserById = async (req,res) => {
    try{
        const userId = req.params.id;

        // Check if email already exists
        const userById = await msnodesqlv8.query`
            Select * From Users where Id = ${userId}
        `;

        if (userById.recordset.length < 1){
            // Conflict
            return res.status(404).json({
                status: 404,
                errorMessage: "User not found"
            });
        }

        //Response
        //status = 201 Created
        res.status(200).json({
            status: 200,
            message:"Success",
            data: userById.recordset
        });

    } catch(error){
        console.error(error);

        res.status(500).json({
            status: 500,
            message:"Internal server error"
        })
    }
}

const deleteUser = async (req,res) => {
    try{
        const userId = req.params.id;

        // Check if email already exists
        const response = await msnodesqlv8.query`
            Delete From Users where Id = ${userId}
        `;

        if (!response){
            // Conflict
            return res.status(500).json({
                status: 500,
                errorMessage: "User could not be deleted"
            });
        }

        //Response
        //status = 201 Created
        res.status(200).json({
            status: 200,
            message:"User deleted successfuly",
        });

    } catch(error){
        console.error(error);

        res.status(500).json({
            status: 500,
            message:"Internal server error"
        })
    }
}

module.exports = {
    registerUser,
    getAllUser,
    getUserById,
    deleteUser
    
}