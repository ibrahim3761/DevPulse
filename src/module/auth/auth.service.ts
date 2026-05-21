import bcrypt from "bcrypt";
import type { IAuth } from "./auth.interface";
import AppError from "../../utility/AppError";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";
import dbQuery from "../../utility/queryHelpers";


const signUp = async (payload: IAuth) => {
  const { email, password, name, role } = payload;

  //Check if user already exists
  const existingUser = await dbQuery(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rowCount! > 0) {
    throw new AppError(
      "User already exists",
      409,
      "An account with this email is already registered",
    );
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await dbQuery(
    `INSERT INTO users(name,email,password,role)
       VALUES($1,$2,$3, COALESCE($4,'contributor'))
       RETURNING *
      `,
    [name, email, hashPassword, role],
  );
  delete result.rows[0].password;
  return result;
};

const logIn = async (payload: IAuth) => {
  const { email, password } = payload;
  // Check if the user exists in the database
  const userData = await dbQuery(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (userData.rowCount === 0) {
    throw new AppError("User not found", 404, "No user exists with this email");
  }

  const user = userData.rows[0];

  // Compare provided password with hashed password
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new AppError("Invalid password", 401, "The password you entered is incorrect");
  }

  // Gererate JWT token
  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.secret_key, {
    expiresIn: "2d",
  });

  delete user.password;
  return{ token ,user}
};

export const authService = {
  signUp,
  logIn,
};
