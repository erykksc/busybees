import { ensureUserExistsAndLogin } from "@busybees/core/dev";
import { defaultPassword, defaultUsername, getArgValue } from "./utils";

const username = getArgValue("username", defaultUsername);
const password = getArgValue("password", defaultPassword);
ensureUserExistsAndLogin(username, password)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  })
  .catch((error) => {
    const errorOutput = {
      success: false,
      message: "Unexpected script error.",
      error: {
        name: error.name,
        message: error.message,
      },
    };
    console.log(JSON.stringify(errorOutput, null, 2));
    process.exit(1);
  });
