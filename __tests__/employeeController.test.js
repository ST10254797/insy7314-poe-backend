// tests/employeeController.test.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../Models/employeeModel");
const Transaction = require("../Models/Transaction");
const controller = require("../Controllers/employeeController");

jest.mock("../Models/employeeModel");
jest.mock("../Models/Transaction");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Employee Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("employeeLogin", () => {
    it("should return 401 if employee not found", async () => {
      Employee.findOne.mockResolvedValue(null);
      const req = { body: { email: "test@test.com", password: "1234" } };
      const res = mockResponse();

      await controller.employeeLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 200 with token on valid credentials", async () => {
      Employee.findOne.mockResolvedValue({ password: "hashed", _id: "1", role: "employee" });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token123");

      const req = { body: { email: "test@test.com", password: "1234" } };
      const res = mockResponse();

      await controller.employeeLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "token123" }));
    });

    it("should handle unexpected errors", async () => {
      Employee.findOne.mockRejectedValue(new Error("DB failure"));
      const req = { body: { email: "test@test.com", password: "1234" } };
      const res = mockResponse();

      await controller.employeeLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Server error" }));
    });
  });

  describe("getPendingTransactions", () => {
    it("should return 200 with transactions", async () => {
      Transaction.find.mockResolvedValue([{ id: 1, status: "Pending" }]);
      const req = {};
      const res = mockResponse();

      await controller.getPendingTransactions(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle database errors", async () => {
      Transaction.find.mockRejectedValue(new Error("DB error"));
      const res = mockResponse();

      await controller.getPendingTransactions({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error fetching transactions" }));
    });
  });

  describe("verifyTransaction", () => {
    it("should return 404 if transaction not found", async () => {
      Transaction.findById.mockResolvedValue(null);
      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.verifyTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update transaction to Verified if found", async () => {
      const mockTransaction = { status: "Pending", save: jest.fn() };
      Transaction.findById.mockResolvedValue(mockTransaction);

      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.verifyTransaction(req, res);
      expect(mockTransaction.status).toBe("Verified");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle errors gracefully", async () => {
      Transaction.findById.mockRejectedValue(new Error("DB failure"));
      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.verifyTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error verifying transaction" }));
    });
  });

  describe("submitToSwift", () => {
    it("should return 404 if transaction not found", async () => {
      Transaction.findById.mockResolvedValue(null);
      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.submitToSwift(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update transaction to 'Submitted to SWIFT' if found", async () => {
      const mockTransaction = { status: "Verified", save: jest.fn() };
      Transaction.findById.mockResolvedValue(mockTransaction);

      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.submitToSwift(req, res);
      expect(mockTransaction.status).toBe("Submitted to SWIFT");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle errors gracefully", async () => {
      Transaction.findById.mockRejectedValue(new Error("DB crash"));
      const req = { params: { id: "1" } };
      const res = mockResponse();

      await controller.submitToSwift(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error submitting transaction" }));
    });
  });
});

// Mock helper for response
function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
