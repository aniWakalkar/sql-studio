// Everything the app starts with lives in the content/ folder
import companySql from '../content/company.sql?raw'
import practiceSql from '../content/practice.sql?raw'
import readme from '../content/notes/README.MD?raw'
import practiceGuide from '../content/notes/PRACTICE.md?raw'
import appGuide from './notes/APP-GUIDE.md?raw'

// Database name -> SQL script that creates its tables and data
export const DEFAULT_DATABASES = {
  company: companySql,
}

export const DEFAULT_QUERY_FILE = { name: 'practice.sql', content: practiceSql }

export const NOTES = [
  { id: 'app-guide', name: 'APP-GUIDE.md', content: appGuide },
  { id: 'readme', name: 'README.MD', content: readme },
  { id: 'practice', name: 'PRACTICE.md', content: practiceGuide },
]
