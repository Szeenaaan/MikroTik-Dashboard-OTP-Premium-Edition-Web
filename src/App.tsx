import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import { ToastProvider } from './components/feedback/Toast'
import { AuthProvider } from './services/authService'
import { AppRouter } from './routes/AppRouter'
import { ApiErrorNavigator } from './routes/ApiErrorNavigator'

export default function App() {
  return <ThemeProvider><ToastProvider><BrowserRouter basename={import.meta.env.BASE_URL}><AuthProvider><ApiErrorNavigator/><AppRouter/></AuthProvider></BrowserRouter></ToastProvider></ThemeProvider>
}
