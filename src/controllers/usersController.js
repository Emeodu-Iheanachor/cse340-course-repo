import * as usersModel from "../models/users.js";


/* =========================================================
   DISPLAY ALL USERS
========================================================= */
export const buildUsers = async (req, res) => {
  try {
    const users = await usersModel.getAllUsers();

    res.render("users/users", {
      title: "Users",
      users
    });

  } catch (error) {
    console.error("Error retrieving users:", error);

    req.flash(
      "notice",
      "Unable to retrieve users."
    );

    res.redirect("/dashboard");
  }
};
