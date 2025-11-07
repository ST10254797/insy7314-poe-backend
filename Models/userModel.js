const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, unique: true },
    IDNumber: { type: String, required: true, unique: true },
    AccNumber: { type: Number, required: true, unique: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // MFA fields
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: null }, // base32 secret for TOTP

  // store refresh tokens (simple approach)
  refreshTokens: [refreshTokenSchema]
}, { timestamps: true });




userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);