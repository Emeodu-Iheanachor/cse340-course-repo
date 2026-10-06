import bcrypt from "bcrypt";
import * as usersModel from "../models/users.js";


/* =========================================================
   DISPLAY LOGIN
========================================================= */
export const buildLogin = async (req, res) => {
  res.render("auth/login", {
    title: "Login"
  });
};


/* =========================================================
   PROCESS LOGIN
========================================================= */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields.
    if (!email || !password) {
      req.flash(
        "notice",
        "Email and password are required."
      );

      return res.status(400).render("auth/login", {
        title: "Login",
        email
      });
    }

    // Find user by email.
    const user = await usersModel.getUserByEmail(email);

    if (!user) {
      req.flash(
        "notice",
        "Invalid email or password."
      );

      return res.status(401).render("auth/login", {
        title: "Login",
        email
      });
    }

    // Compare submitted password with hashed password.
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      req.flash(
        "notice",
        "Invalid email or password."
      );

      return res.status(401).render("auth/login", {
        title: "Login",
        email
      });
    }

    // Store authenticated user in the session.
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role_name: user.role_name
    };

    req.flash(
      "success",
      `Welcome back, ${user.name}!`
    );

    return res.redirect("/dashboard");

  } catch (error) {
    console.error("Login error:", error);

    req.flash(
      "notice",
      "An error occurred while logging in."
    );

    return res.status(500).render("auth/login", {
      title: "Login",
      email
    });
  }
};


/* =========================================================
   LOGOUT
========================================================= */
export const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.redirect("/dashboard");
    }

    res.redirect("/");
  });
};
