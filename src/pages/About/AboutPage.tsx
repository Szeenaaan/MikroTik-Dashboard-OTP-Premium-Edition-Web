
import { Github, Mail, Wifi } from 'lucide-react'
import { AppCard } from '../../components/common/AppCard'


const developerName = import.meta.env.VITE_DEVELOPER_NAME || 'Sinan'
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || ''
const githubUrl = import.meta.env.VITE_CONTACT_GITHUB || ''
const copyright = import.meta.env.VITE_COPYRIGHT_TEXT || ''
const version = import.meta.env.VITE_APP_VERSION|| ''

export function AboutPage() {
  return (
    <div className="page-stack about-page">
      <div className="page-heading">
        <h1>About</h1>
      </div>

      <AppCard className="about-hero">
        <div className="about-logo">
          <Wifi size={34} />
        </div>

        <h2>netddash</h2>
        <span className="about-version">
          Version {version}
        </span>
      </AppCard>

      <AppCard className="about-info-card">
        <div className="about-info-rows">
          <div className="about-info-row">
            <span>Developer</span>
            <strong>{developerName}</strong>
          </div>

          <div className="about-info-row">
            <span>Email</span>
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`}>
                <Mail size={16} />
                {contactEmail}
              </a>
            ) : (
              <strong>—</strong>
            )}
          </div>

          <div className="about-info-row">
            <span>GitHub</span>
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={16} />
                {githubUrl.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <strong>—</strong>
            )}
          </div>

          <div className="about-info-row">
            <span>Copyright</span>
            <strong>{copyright || '—'}</strong>
          </div>
        </div>
      </AppCard>
    </div>
  )
}
