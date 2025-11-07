const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

// Mock bcrypt
jest.mock("bcryptjs", () => ({ hash: jest.fn() }));

// Mock auth middleware to bypass JWT
jest.mock("../Middleware/authMiddleware", () => ({
protect: (req, res, next) => next(),
authorize: () => (req, res, next) => next()
}));

// Mock Employee model inside factory (no external variables!)
jest.mock("../Models/employeeModel", () => {
const mSave = jest.fn();
const mFindOne = jest.fn();
const mFind = jest.fn();

class Employee {
constructor() {
return { save: mSave };
}
static findOne = mFindOne;
static find = mFind;
}

// Export mocks so we can access them in tests
Employee.__mSave = mSave;
Employee.__mFindOne = mFindOne;
Employee.__mFind = mFind;

return Employee;
});

const Employee = require("../Models/employeeModel");

// Setup express app for testing
const app = express();
app.use(bodyParser.json());
const managerRoutes = require("../Routes/managerRoutes");
app.use("/api/manager", managerRoutes);

describe("Manager Controller", () => {
beforeEach(() => {
jest.clearAllMocks();
});

test("should add employee successfully", async () => {
Employee.__mFindOne.mockResolvedValue(null);
Employee.__mSave.mockResolvedValue(true);
bcrypt.hash.mockResolvedValue("hashed-password");


const newEmployee = {  
  name: "John Doe",  
  employeeId: "EMP001",  
  email: "john@example.com",  
  password: "password123",  
  role: "employee"  
};  

const response = await request(app)  
  .post("/api/manager/add-employee")  
  .send(newEmployee);  

expect(Employee.__mFindOne).toHaveBeenCalledWith({ email: "john@example.com" });  
expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);  
expect(Employee.__mSave).toHaveBeenCalled();  
expect(response.status).toBe(201);  
expect(response.body).toHaveProperty("message", "Employee added successfully");  
expect(response.body.employee).toEqual({  
  name: "John Doe",  
  employeeId: "EMP001",  
  email: "john@example.com",  
  role: "employee"  
});  


});

test("should not add employee if duplicate exists", async () => {
Employee.__mFindOne.mockResolvedValue({ email: "[john@example.com](mailto:john@example.com)" });


const response = await request(app)  
  .post("/api/manager/add-employee")  
  .send({  
    name: "John Doe",  
    employeeId: "EMP001",  
    email: "john@example.com",  
    password: "password123",  
    role: "employee"  
  });  

expect(response.status).toBe(400);  
expect(response.body).toHaveProperty("message", "Employee already exists");  


});

test("should fetch all employees", async () => {
const mockEmployees = [
{ name: "John", employeeId: "EMP001", email: "[john@example.com](mailto:john@example.com)", role: "employee" },
{ name: "Jane", employeeId: "EMP002", email: "[jane@example.com](mailto:jane@example.com)", role: "manager" }
];


Employee.__mFind.mockReturnValue({ select: jest.fn().mockResolvedValue(mockEmployees) });  

const response = await request(app).get("/api/manager/all-employees");  

expect(Employee.__mFind).toHaveBeenCalled();  
expect(response.status).toBe(200);  
expect(response.body).toEqual(mockEmployees);  


});

test("should return 500 if addEmployee throws error", async () => {
Employee.__mFindOne.mockRejectedValue(new Error("DB error"));


const response = await request(app)  
  .post("/api/manager/add-employee")  
  .send({  
    name: "John Doe",  
    employeeId: "EMP001",  
    email: "john@example.com",  
    password: "password123",  
    role: "employee"  
  });  

expect(response.status).toBe(500);  
expect(response.body).toHaveProperty("message", "Error adding employee");  


});

test("should return 500 if getAllEmployees throws error", async () => {
Employee.__mFind.mockImplementation(() => { throw new Error("DB error"); });


const response = await request(app).get("/api/manager/all-employees");  

expect(response.status).toBe(500);  
expect(response.body).toHaveProperty("message", "Error fetching employees");  


});
});
