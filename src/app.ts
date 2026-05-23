import express, { type Application } from "express"
import { authRoute } from "./module/auth/auth.route"
import { issuesRouter } from "./module/issues/issues.route"

const app : Application = express()

app.use(express.json())

app.use('/api/auth', authRoute)
app.use('/api/issues', issuesRouter)

app.get('/', (req, res) => {
  res.send('Welcome to Dev pulse!!')
})

export default app