import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setServers } from 'node:dns'
import { parse } from 'csv-parse/sync'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

type Question = {
  id: number
  category: string
  difficulty: Difficulty
  prompt: string
  options: string[]
  answer: string
}

type Difficulty = 'Easy' | 'Medium' | 'Average' | 'Hard'

type Session = { questions: Question[]; answers: Record<number, string>; userId: string }
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true, collection: 'users' })
const UserModel = mongoose.model('User', userSchema)
const leaderboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
}, { timestamps: true, collection: 'leaderboard' })
const LeaderboardModel = mongoose.model('Leaderboard', leaderboardSchema)

const questionBanks: Record<string, [string, string, ...string[]][]> = {
  Geography: [
    ['What is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    ['Which river flows through Egypt?', 'The Nile', 'The Amazon', 'The Danube', 'The Thames'],
    ['What is the largest ocean on Earth?', 'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
    ['Which country is shaped like a boot?', 'Italy', 'Greece', 'Portugal', 'Chile'],
    ['What is the highest mountain above sea level?', 'Mount Everest', 'K2', 'Kilimanjaro', 'Denali'],
  ],
  'Computer Science': [
    ['What does CPU stand for?', 'Central Processing Unit', 'Computer Personal Utility', 'Core Program User', 'Central Power Utility'],
    ['Which data structure uses FIFO ordering?', 'Queue', 'Stack', 'Tree', 'Graph'],
    ['What does HTML primarily describe?', 'Web page structure', 'Database encryption', 'Image compression', 'Network routing'],
    ['Which language is commonly used for data science?', 'Python', 'HTML', 'CSS', 'SQL'],
    ['What is an algorithm?', 'A step-by-step procedure', 'A storage device', 'A web browser', 'A computer cable'],
  ],
  'Current Affairs': [
    ['Which organization publishes the World Economic Outlook?', 'The IMF', 'The IOC', 'The WTO', 'UNESCO'],
    ['What does COP commonly refer to in climate discussions?', 'Conference of the Parties', 'Council of Peace', 'Committee of Presidents', 'Carbon Output Plan'],
    ['Which international body is headquartered in New York and works on global cooperation?', 'The United Nations', 'The Red Cross', 'The OECD', 'The World Bank'],
    ['What is the main purpose of a national census?', 'Count and describe the population', 'Set stock prices', 'Forecast rainfall', 'Choose a sports team'],
    ['What does renewable energy come from?', 'Naturally replenished sources', 'Finite fossil fuels', 'Only nuclear reactions', 'Imported batteries'],
  ],
  Science: [['What is the chemical symbol for oxygen?', 'O2', 'CO2', 'H2O', 'N2'], ['What force pulls objects toward Earth?', 'Gravity', 'Friction', 'Magnetism', 'Pressure'], ['What is the center of an atom called?', 'Nucleus', 'Electron', 'Cell', 'Orbit'], ['Which gas do plants absorb?', 'Carbon dioxide', 'Oxygen', 'Helium', 'Hydrogen'], ['What is water made of?', 'Hydrogen and oxygen', 'Carbon and iron', 'Nitrogen and helium', 'Calcium and salt']],
  History: [['Which civilization built Machu Picchu?', 'Inca', 'Roman', 'Mayan', 'Viking'], ['Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'John Glenn'], ['The ancient Olympic Games began in which country?', 'Greece', 'Italy', 'Egypt', 'China'], ['Which document begins with “We the People”?', 'The U.S. Constitution', 'Magna Carta', 'The Bill of Rights', 'The Treaty of Versailles'], ['Who was known as the Maid of Orleans?', 'Joan of Arc', 'Cleopatra', 'Boudica', 'Marie Curie']],
  'Arts & Culture': [['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Van Gogh', 'Monet', 'Picasso'], ['Which instrument has black and white keys?', 'Piano', 'Violin', 'Trumpet', 'Flute'], ['Which city is famous for the Louvre museum?', 'Paris', 'Rome', 'Madrid', 'Vienna'], ['What is a haiku?', 'A short poem', 'A sculpture', 'A dance', 'A painting'], ['Which art movement is associated with Picasso?', 'Cubism', 'Baroque', 'Gothic', 'Pop art']],
  Sports: [['How many players start on a soccer team?', '11', '9', '10', '12'], ['How many points is a basketball free throw worth?', '1', '2', '3', '4'], ['In which sport is Wimbledon held?', 'Tennis', 'Golf', 'Cricket', 'Rugby'], ['What color jersey is worn by the Tour de France leader?', 'Yellow', 'Green', 'Red', 'White'], ['How long is an Olympic swimming pool?', '50 meters', '25 meters', '100 meters', '75 meters']],
  Nature: [['What is the largest land animal?', 'African elephant', 'Giraffe', 'Blue whale', 'Rhinoceros'], ['What process lets plants make food from light?', 'Photosynthesis', 'Respiration', 'Digestion', 'Fermentation'], ['What is a baby frog called?', 'Tadpole', 'Calf', 'Cub', 'Chick'], ['Which mammal can fly?', 'Bat', 'Penguin', 'Ostrich', 'Flying fish'], ['What is the fastest land animal?', 'Cheetah', 'Horse', 'Lion', 'Gazelle']],
  Literature: [['Who wrote Pride and Prejudice?', 'Jane Austen', 'Mary Shelley', 'Charles Dickens', 'Emily Bronte'], ['Who wrote The Odyssey?', 'Homer', 'Plato', 'Virgil', 'Sophocles'], ['What is the name of Sherlock Holmes’s friend?', 'Dr. Watson', 'Mr. Darcy', 'Samwise Gamgee', 'Tom Sawyer'], ['A story with a moral lesson is a what?', 'Fable', 'Sonnet', 'Biography', 'Atlas'], ['Who wrote One Hundred Years of Solitude?', 'Gabriel Garcia Marquez', 'Leo Tolstoy', 'Chinua Achebe', 'James Joyce']],
  Business: [['What does GDP measure?', 'Economic output', 'Population growth', 'Interest rates', 'Trade tariffs'], ['What is a budget?', 'A plan for income and spending', 'A company logo', 'A bank building', 'A sales receipt'], ['What does a shareholder own?', 'Part of a company', 'A government bond only', 'A patent office', 'A warehouse lease'], ['What is inflation?', 'A general rise in prices', 'A fall in employment only', 'A fixed exchange rate', 'A new company'], ['What is an entrepreneur?', 'A person who starts a venture', 'A tax collector', 'A professional athlete', 'A bank customer']],
}

const questions: Question[] = Array.from({ length: 1000 }, (_, index) => {
  const categoryNames = Object.keys(questionBanks)
  const category = categoryNames[index % categoryNames.length]
  const bank = questionBanks[category]
  const [prompt, answer, ...distractors] = bank[Math.floor(index / categoryNames.length) % bank.length]
  const options = [answer, ...distractors]
  const shift = index % options.length
  const difficulty: Difficulty = ['Easy', 'Medium', 'Average', 'Hard'][Math.floor(index / categoryNames.length) % 4] as Difficulty
  return { id: index + 1, category, difficulty, prompt, options: options.slice(shift).concat(options.slice(0, shift)), answer }
})

type CodingRow = { id: string; title: string; description: string; difficulty_level: string }
const codingRows = parse(readFileSync(join(process.cwd(), 'data', 'questions_dataset.csv')), { columns: true, skip_empty_lines: true, relax_column_count: true }) as CodingRow[]
const normalizeDifficulty = (value: string): Difficulty => {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'easy') return 'Easy'
  if (normalized === 'hard') return 'Hard'
  if (normalized === 'average') return 'Average'
  return 'Medium'
}
const codingQuestions: Question[] = codingRows.map((row, index) => ({
  id: 1001 + index,
  category: 'Computer Science',
  difficulty: normalizeDifficulty(row.difficulty_level),
  prompt: `What difficulty level is the coding challenge “${row.title}”?\n\n${row.description}`,
  options: ['Easy', 'Medium', 'Average', 'Hard'],
  answer: normalizeDifficulty(row.difficulty_level),
}))
questions.push(...codingQuestions)
const quizQuestions = Array.from(new Map(questions.map((question) => [`${question.category}:${question.prompt}`, question])).values())

const sessions = new Map<string, Session>()
const authTokens = new Map<string, string>()
const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/auth/register', async (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!name || !email || password.length < 6) return response.status(400).json({ error: 'Enter a name, valid email, and password with at least 6 characters' })
  if (await UserModel.exists({ email })) return response.status(409).json({ error: 'An account with this email already exists' })
  const user = await UserModel.create({ name, email, passwordHash: await bcrypt.hash(password, 10) })
  const token = randomUUID()
  authTokens.set(token, user._id.toString())
  response.status(201).json({ token, user: { id: user._id.toString(), name: user.name, email: user.email } })
})
app.post('/api/auth/login', async (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const user = await UserModel.findOne({ email })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return response.status(401).json({ error: 'Email or password is incorrect' })
  const token = randomUUID()
  authTokens.set(token, user._id.toString())
  response.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email } })
})

async function getAuthenticatedUser(request: express.Request) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  const userId = token ? authTokens.get(token) : undefined
  return userId ? UserModel.findById(userId) : null
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', questionCount: quizQuestions.length }))
app.get('/api/categories', (_request, response) => response.json([...new Set(quizQuestions.map((question) => question.category))]))
app.get('/api/difficulties', (_request, response) => response.json(['Easy', 'Medium', 'Average', 'Hard']))
app.post('/api/quiz/start', async (request, response) => {
  const user = await getAuthenticatedUser(request)
  if (!user) return response.status(401).json({ error: 'Please log in before starting a quiz' })
  const count = Math.min(Math.max(Number(request.body?.count) || 10, 5), 40)
  const category = typeof request.body?.category === 'string' ? request.body.category : 'All fields'
  const difficulty = typeof request.body?.difficulty === 'string' ? request.body.difficulty : 'All levels'
  if (difficulty !== 'All levels' && !['Easy', 'Medium', 'Average', 'Hard'].includes(difficulty)) return response.status(400).json({ error: 'Unknown difficulty level' })
  const pool = quizQuestions.filter((question) => (category === 'All fields' || question.category === category) && (difficulty === 'All levels' || question.difficulty === difficulty))
  if (pool.length === 0) return response.status(400).json({ error: 'No questions match this field and difficulty' })
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
  const id = randomUUID()
  sessions.set(id, { questions: shuffled, answers: {}, userId: user._id.toString() })
  response.json({ sessionId: id, questions: shuffled.map(({ answer: _answer, ...question }) => question) })
})
app.post('/api/quiz/:sessionId/answer', (request, response) => {
  const session = sessions.get(request.params.sessionId)
  if (!session || typeof request.body?.questionId !== 'number') return response.status(404).json({ error: 'Quiz session not found' })
  session.answers[request.body.questionId] = request.body.answer
  response.json({ saved: true })
})
app.post('/api/quiz/:sessionId/finish', async (request, response) => {
  const session = sessions.get(request.params.sessionId)
  if (!session) return response.status(404).json({ error: 'Quiz session not found' })
  const score = session.questions.reduce((total, question) => total + (session.answers[question.id] === question.answer ? 1 : 0), 0)
  const user = await UserModel.findById(session.userId)
  if (user) {
    await LeaderboardModel.create({
      name: user.name,
      email: user.email,
      score,
      total: session.questions.length,
      percentage: Math.round((score / session.questions.length) * 100),
      category: [...new Set(session.questions.map((question) => question.category))].join(', '),
      difficulty: [...new Set(session.questions.map((question) => question.difficulty))].join(', '),
    })
  }
  sessions.delete(request.params.sessionId)
  response.json({ score, total: session.questions.length, percentage: Math.round((score / session.questions.length) * 100) })
})
app.get('/api/leaderboard', async (_request, response) => {
  const entries = await LeaderboardModel.find().sort({ percentage: -1, score: -1, createdAt: 1 }).limit(100).select('-_id name email score total percentage category difficulty createdAt').lean()
  response.json(entries)
})

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/quizzzz'
setServers(['8.8.8.8', '1.1.1.1'])
async function startServer() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      app.listen(4000, () => console.log('Quiz API running at http://localhost:4000'))
      return
    } catch (error) {
      if (attempt === 3) {
        console.error('MongoDB connection failed. Set MONGODB_URI and make sure MongoDB is running.', error)
        process.exit(1)
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}
void startServer()
