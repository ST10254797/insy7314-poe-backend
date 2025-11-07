const User = require('../Models/userModel');
const { generateToken, createRefreshToken } = require('../utils/generateToken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

// Helper to add refresh token to user (and set expiry)
const addRefreshTokenToUser = async (user, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // refresh token valid 30 days
  user.refreshTokens.push({ token, expiresAt });
  await user.save();
};

// Register a new users
exports.registerUser = async (req, res) => {
    try {
        const { fullName, IDNumber, AccNumber, userName, password } = req.body;
        const userExists = await User.findOne({ userName });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = await User.create({ fullName, IDNumber, AccNumber, userName, password });
        res.status(201).json({message: 'User registered successfully'})
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

        // If user has MFA enabled, require a TOTP code
        if (user.mfaEnabled) {
            if (!mfaCode) {
                // indicate MFA required
                return res.status(206).json({ message: 'MFA required', mfaRequired: true });
            }

            const verified = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: String(mfaCode),
                window: 1 // allow 1 step drift
            });

            if (!verified) {
                return res.status(401).json({ message: 'Invalid MFA code' });
            }
        }

        // Generate tokens
        const accessToken = generateToken({ id: user._id.toString(), role: 'customer' });
        const refreshToken = createRefreshToken();

        await addRefreshTokenToUser(user, refreshToken);

        // Return refresh token as httpOnly cookie + access token in response body
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30*24*60*60*1000 // 30 days
        });

        res.status(200).json({ message: 'Login successful', token: accessToken });
    } 
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Initiate MFA setup (generate secret + QR)
exports.initiateEnableMFA = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate temporary secret
    const secret = speakeasy.generateSecret({
      name: `SecureApp (${user.userName})`,
      length: 32,
    });

    // Store temp secret on user until verified
    user.mfaTempSecret = secret.base32;
    await user.save();

    // Generate QR code for scanning with Google Authenticator
    const qrImageUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      message: 'MFA initiation successful',
      qrImageUrl, // base64 QR image for the frontend
      secret: secret.base32, // optional, for backup entry
    });
  } catch (error) {
    console.error('MFA initiation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Verify the code after scanning and enable MFA permanently
exports.verifyEnableMFA = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const { token } = req.body; // TOTP code from user
    const user = await User.findById(userId);
    if (!user || !user.mfaTempSecret) return res.status(400).json({ message: 'MFA setup not initiated' });

    const verified = speakeasy.totp.verify({
      secret: user.mfaTempSecret,
      encoding: 'base32',
      token: String(token),
      window: 1
    });

    if (!verified) return res.status(400).json({ message: 'Invalid MFA code' });

    // enable MFA
    user.mfaSecret = user.mfaTempSecret;
    user.mfaTempSecret = undefined;
    user.mfaEnabled = true;
    await user.save();

    res.status(200).json({ message: 'MFA enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    // find user with this refresh token
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    // Check expiry
    const tokenDoc = user.refreshTokens.find(rt => rt.token === refreshToken);
    if (!tokenDoc || new Date(tokenDoc.expiresAt) < new Date()) {
      // remove expired token if present
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
      await user.save();
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // generate new access token
    const accessToken = generateToken({ id: user._id.toString(), role: 'customer' });

    res.status(200).json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout and revoke refresh token
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ 'refreshTokens.token': refreshToken });
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
        await user.save();
      }
      res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    }
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
