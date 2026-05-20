import app from "./app";
import { initDB } from "./db";

const port = 5000;

const main = () => {
  initDB();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};


main();
