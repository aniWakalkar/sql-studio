// Everything the app starts with lives in the content/ folder
import companySql from '../content/company.sql?raw'
import practiceSql from '../content/practice.sql?raw'
import readme from '../content/notes/README.MD?raw'
import practiceGuide from '../content/notes/PRACTICE.md?raw'
import interviewQuestions from '../content/notes/INTERVIEW-QUESTIONS.md?raw'
import appGuide from './notes/APP-GUIDE.md?raw'

// Database name -> SQL script that creates its tables and data
export const DEFAULT_DATABASES = {
  company: companySql,
}

export const DEFAULT_QUERY_FILE = { name: 'practice.sql', content: practiceSql }

// Images used by the notes, e.g. ![…](images/db-relationship.svg) -> bundled URL
const imageUrls = import.meta.glob('../content/notes/images/*', { eager: true, query: '?url', import: 'default' })
export const NOTE_IMAGES = Object.fromEntries(
  Object.entries(imageUrls).map(([path, url]) => [path.replace('../content/notes/', ''), url]),
)

export const NOTES = [
  { id: 'app-guide', name: 'APP-GUIDE.md', content: appGuide },
  { id: 'readme', name: 'README.MD', content: readme },
  { id: 'practice', name: 'PRACTICE.md', content: practiceGuide },
  { id: 'interview', name: 'INTERVIEW-QUESTIONS.md', content: interviewQuestions },
]
