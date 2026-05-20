import express, { type Application } from "express"
import { authRoute } from "./module/auth/auth.route"

const app : Application = express()

app.use(express.json())

app.use('/api/auth', authRoute)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app