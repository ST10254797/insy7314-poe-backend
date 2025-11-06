process.env.JWT_SECRET = "testsecret"; // Must be set before importing the controller

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
// Suppress console.error during tests
beforeAll(() => {
jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
console.error.mockRestore();
});

afterEach(() => {
jest.clearAllMocks();
});

// Helper for response
function mockResponse() {
const res = {};
res.status = jest.fn().mockReturnValue(res);
res.json = jest.fn().mockReturnValue(res);
return res;
}

// -------------------------
// Employee Login
// -------------------------
describe("employeeLogin", () => {

  it("should return 401 if employee not found", async () => {
    // Mock findOne().lean() to return null
    Employee.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const req = { body: { email: "test@test.com", password: "1234" } };
    const res = mockResponse();

    await controller.employeeLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid credentials" })
    );
  });

  it("should return 200 with token on valid credentials", async () => {
    // Mock findOne().lean() to return an employee object
    Employee.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ password: "hashed", _id: "1", role: "employee" })
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token123");

    const req = { body: { email: "test@test.com", password: "1234" } };
    const res = mockResponse();

    await controller.employeeLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "token123", role: "employee" })
    );
  });

  it("should return 401 if password does not match", async () => {
    // Mock findOne().lean() to return an employee object
    Employee.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ password: "hashed", _id: "1", role: "employee" })
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: "test@test.com", password: "wrongpass" } };
    const res = mockResponse();

    await controller.employeeLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid credentials" })
    );
  });

});


// -------------------------
// Get Pending Transactions
// -------------------------
describe("getPendingTransactions", () => {
it("should return 200 with transactions", async () => {
Transaction.find.mockResolvedValue([{ id: 1, status: "Pending" }]);


  const req = {};
  const res = mockResponse();

  await controller.getPendingTransactions(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.arrayContaining([{ id: 1, status: "Pending" }])
  );
});

it("should handle database errors", async () => {
  Transaction.find.mockImplementation(async () => {
    throw new Error("DB error");
  });

  const res = mockResponse();
  await controller.getPendingTransactions({}, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Error fetching transactions" })
  );
});


});

// -------------------------
// Verify Transaction
// -------------------------
describe("verifyTransaction", () => {
it("should return 404 if transaction not found", async () => {
Transaction.findById.mockResolvedValue(null);


  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.verifyTransaction(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Transaction not found" })
  );
});

it("should update transaction to Verified if found", async () => {
  const mockTransaction = { status: "Pending", save: jest.fn() };
  Transaction.findById.mockResolvedValue(mockTransaction);

  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.verifyTransaction(req, res);

  expect(mockTransaction.status).toBe("Verified");
  expect(mockTransaction.save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Transaction verified successfully" })
  );
});

it("should handle errors gracefully", async () => {
  Transaction.findById.mockImplementation(async () => {
    throw new Error("DB failure");
  });

  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.verifyTransaction(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Error verifying transaction" })
  );
});


});

// -------------------------
// Submit to SWIFT
// -------------------------
describe("submitToSwift", () => {
it("should return 404 if transaction not found", async () => {
Transaction.findById.mockResolvedValue(null);


  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.submitToSwift(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Transaction not found" })
  );
});

it("should update transaction to 'Submitted to SWIFT' if found", async () => {
  const mockTransaction = { status: "Verified", save: jest.fn() };
  Transaction.findById.mockResolvedValue(mockTransaction);

  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.submitToSwift(req, res);

  expect(mockTransaction.status).toBe("Submitted to SWIFT");
  expect(mockTransaction.save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Transaction submitted to SWIFT" })
  );
});

it("should handle errors gracefully", async () => {
  Transaction.findById.mockImplementation(async () => {
    throw new Error("DB crash");
  });

  const req = { params: { id: "1" } };
  const res = mockResponse();

  await controller.submitToSwift(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Error submitting transaction" })
  );
});


});
});
