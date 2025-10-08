const User = require('../Models/userModel');
const generateToken = require('../utils/generateToken');

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { fullName, IDNumber, AccNumber, userName, password } = req.body;
        const userExists = await User.findOne({ userName });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = await User.create({ fullName, IDNumber, AccNumber, userName, password });
        res.status(201).json({message: 'User registered successfully'});
    } 
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


// Authenticate user and get token
exports.loginUser = async (req, res) => {
    try {
        const{userName, AccNumber, password} = req.body;
        const user = await User.findOne({ userName, AccNumber });
        if(!user){
            return res.status(400).json({message: 'Invalid username or account number'});
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: 'Invalid password'});
        }

        const token = generateToken(user._id);
        res.status(200).json({ message: "Login successful",token });
    } 
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
