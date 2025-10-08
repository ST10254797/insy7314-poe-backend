module.exports = (req, res, next) => {
    const { fullName, IDNumber, AccNumber, userName, password } = req.body;
    const regexName = /^[a-zA-Z\s]+$/;
    const regexID = /^\d{13}$/;
    const regexAcc = /^\d{8,12}$/; 
    const regexUser = /^[a-zA-Z0-9_]{4,20}$/;
   const regexPass = /^[A-Za-z0-9!@#$%^&*]{8,12}$/;


    if (!fullName || !IDNumber || !AccNumber || !userName || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!regexName.test(fullName) || 
        !regexID.test(IDNumber) || 
        !regexAcc.test(AccNumber.toString()) || 
        !regexUser.test(userName) || 
        !regexPass.test(password)) 
    {
        return res.status(400).json({ message: 'Invalid input format' });
    }

    next();
};

