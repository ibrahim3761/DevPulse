import app from "./app";
import { initDB } from "./db";

const port = process.env.PORT;

const main = () => {
  initDB();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};


main();
