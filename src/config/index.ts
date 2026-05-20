import dotenv from "dotenv"
import path from "path"

dotenv.config({
    path : path.join(process.cwd(), ".env")
})

const config = {
    connection_string : process.env.CONNECTIONSTRING as string,
    port : process.env.PORT,
    secret_key : process.env.SECRET_KEY as string,
    refresh_secret_key : process.env.REFRESH_SECRET_KEY as string
}

export default config