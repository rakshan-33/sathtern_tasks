import { type FormEvent, useCallback, useEffect, useState } from 'react'
import './App.css'

type Question = { id: number; category: string; difficulty: string; prompt: string; options: string[] }
type Result = { score: number; total: number; percentage: number }
type User = { id: string; name: string; email: string }
type LeaderboardEntry = { name: string; email: string; score: number; total: number; percentage: number; category: string; difficulty: string }
const API = 'http://localhost:4000/api'
const categories = ['All fields', 'Geography', 'Computer Science', 'Current Affairs', 'Science', 'History', 'Arts & Culture', 'Sports', 'Nature', 'Literature', 'Business']
const difficulties = ['All levels', 'Easy', 'Medium', 'Average', 'Hard']

function App() {
  const [page, setPage] = useState<'login' | 'register' | 'home' | 'quiz' | 'results' | 'leaderboard'>('login')
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(10)
  const [category, setCategory] = useState('All fields')
  const [difficulty, setDifficulty] = useState('All levels')
  const [timer, setTimer] = useState(true)
  const [seconds, setSeconds] = useState(300)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const finishQuiz = useCallback(async () => {
    const response = await fetch(`${API}/quiz/${sessionId}/finish`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('quizzzz-token') ?? ''}` } })
    setResult(await response.json()); setPage('results')
  }, [sessionId])

  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setAuthError(''); setLoading(true)
    const endpoint = page === 'register' ? 'register' : 'login'
    const response = await fetch(`${API}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }) })
    const data = await response.json()
    if (!response.ok) { setAuthError(data.error ?? 'Authentication failed'); setLoading(false); return }
    localStorage.setItem('quizzzz-token', data.token); setUser(data.user); setAuthPassword(''); setPage('home'); setLoading(false)
  }

  function logout() { localStorage.removeItem('quizzzz-token'); setUser(null); setPage('login') }

  async function showLeaderboard() {
    const response = await fetch(`${API}/leaderboard`)
    setLeaderboard(await response.json()); setPage('leaderboard')
  }

  useEffect(() => {
    if (page !== 'quiz' || !timer || seconds === 0) return
    const interval = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { void finishQuiz(); return 0 }
      return value - 1
    }), 1000)
    return () => window.clearInterval(interval)
  }, [page, timer, seconds, finishQuiz])

  async function startQuiz() {
    setLoading(true)
    const response = await fetch(`${API}/quiz/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('quizzzz-token') ?? ''}` }, body: JSON.stringify({ count, category, difficulty }) })
    const data = await response.json()
    setQuestions(data.questions); setSessionId(data.sessionId); setAnswers({}); setCurrent(0); setSeconds(count * 30); setPage('quiz'); setLoading(false)
  }

  async function chooseAnswer(answer: string) {
    const question = questions[current]
    setAnswers((values) => ({ ...values, [question.id]: answer }))
    await fetch(`${API}/quiz/${sessionId}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer }) })
  }

  const question = questions[current]
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')

  if (page === 'login' || page === 'register') return <main className="auth-shell"><div className="auth-brand"><span className="brand-mark">Q</span><span>QUIZZZZ</span></div><section className="auth-panel"><p className="eyebrow">{page === 'register' ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</p><h1>{page === 'register' ? <>Ready to get<br /><em>sharper?</em></> : <>Your next<br /><em>challenge.</em></>}</h1><form onSubmit={submitAuth}>{page === 'register' && <label>Full name<input value={authName} onChange={(event) => setAuthName(event.target.value)} required /></label>}<label>Email address<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required /></label><label>Password<input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={6} required /></label>{authError && <p className="auth-error">{authError}</p>}<button className="primary-button" type="submit">{loading ? 'Please wait...' : page === 'register' ? 'Create account' : 'Log in'} <span>→</span></button></form><button className="auth-switch" onClick={() => { setAuthError(''); setPage(page === 'register' ? 'login' : 'register') }}>{page === 'register' ? 'Already have an account? Log in' : 'New here? Create an account'}</button></section></main>

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setPage('home')}><span className="brand-mark">Q</span><span>QUIZZZZ</span></button><div className="header-actions"><button className="nav-button" onClick={() => void showLeaderboard()}>Top scores</button><span className="header-note">{user ? `Hi, ${user.name}` : 'Knowledge, sharpened.'}</span>{user && <button className="logout-button" onClick={logout}>Log out</button>}</div></header>
    {page === 'leaderboard' && <section className="leaderboard-page"><p className="eyebrow">THE TOP SCORES</p><h1>Quiz <em>champions.</em></h1><div className="leaderboard-table"><div className="leaderboard-row leaderboard-heading"><span>PLAYER</span><span>FIELD</span><span>SCORE</span></div>{leaderboard.length === 0 && <p className="empty-board">Complete a quiz to appear here.</p>}{leaderboard.map((entry, index) => <div className="leaderboard-row" key={`${entry.email}-${index}`}><span><strong>{entry.name}</strong><small>{entry.email}</small></span><span>{entry.category}</span><span><strong>{entry.percentage}%</strong><small>{entry.score} / {entry.total}</small></span></div>)}</div><button className="text-button" onClick={() => setPage('home')}>← Back to quiz</button></section>}
    {page === 'home' && <section className="home-page"><div className="hero-copy"><p className="eyebrow">THE DAILY CHALLENGE</p><h1>How much do<br /><em>you</em> know?</h1><p className="intro">A focused, beautifully simple quiz across science, history, culture, and the world around you.</p><button className="primary-button" onClick={() => void startQuiz()}>{loading ? 'Preparing...' : 'Start a quiz'} <span>→</span></button></div><div className="home-aside"><div className="stat"><strong>1,616</strong><span>questions in the vault</span></div><div className="stat"><strong>10</strong><span>wide-ranging categories</span></div><div className="rule" /><p>Take a breath.<br />Trust what you know.</p></div></section>}
  {page === 'quiz' && question && <section className="quiz-page"><div className="quiz-top"><div><p className="eyebrow">{question.category.toUpperCase()} · {question.difficulty.toUpperCase()}</p></div><div className={`timer ${seconds < 30 ? 'urgent' : ''}`}><span className="timer-dot" />{timer ? `${minutes}:${secs}` : 'No timer'}</div></div><div className="progress"><span style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div><div className="question-area"><h2>{question.prompt}</h2><div className="answers">{question.options.map((option, index) => <button className={`answer ${answers[question.id] === option ? 'selected' : ''}`} key={option} onClick={() => void chooseAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><div className="quiz-nav"><button className="text-button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>← Previous</button>{current === questions.length - 1 ? <button className="primary-button small" onClick={() => void finishQuiz()}>Finish quiz <span>→</span></button> : <button className="primary-button small" onClick={() => setCurrent((value) => value + 1)}>Next question <span>→</span></button>}</div><div className="dots">{questions.map((item, index) => <button aria-label={`Go to question ${index + 1}`} className={`${index === current ? 'active' : ''} ${answers[item.id] ? 'answered' : ''}`} key={item.id} onClick={() => setCurrent(index)} />)}</div></section>}
  {page === 'results' && result && <section className="results-page"><p className="eyebrow">QUIZ COMPLETE</p><h1>Nicely done.</h1><div className="score-display"><strong>{result.percentage}<small>%</small></strong><span>Your final score</span></div><p className="result-copy">You answered <strong>{result.score} of {result.total}</strong> questions correctly. Every round is another chance to get sharper.</p><button className="primary-button" onClick={() => setPage('home')}>Back to home <span>↗</span></button></section>}
  {page === 'home' && <section className="setup-strip"><div className="field-picker"><span className="strip-label">CHOOSE A FIELD</span><div className="category-grid">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="difficulty-picker"><span className="strip-label">CHOOSE LEVEL</span><div className="difficulty-grid">{difficulties.map((item) => <button className={difficulty === item ? 'active' : ''} key={item} onClick={() => setDifficulty(item)}>{item}</button>)}</div></div><div className="setup-options"><div><span className="strip-label">QUIZ LENGTH</span><div className="segmented">{[10, 20, 40].map((value) => <button className={count === value ? 'active' : ''} key={value} onClick={() => setCount(value)}>{value}</button>)}</div></div><label className="toggle-label"><span><span className="strip-label">TIME LIMIT</span><small>30 seconds per question</small></span><input type="checkbox" checked={timer} onChange={(event) => setTimer(event.target.checked)} /><i /></label></div></section>}
  </main>
}

export default App
