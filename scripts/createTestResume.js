import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Add these lines to define __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create resumes directory if it doesn't exist
const resumesDir = path.join(__dirname, "..", "resumes");
if (!fs.existsSync(resumesDir)) {
	fs.mkdirSync(resumesDir, { recursive: true });
}

// Create a simple text file as a test resume
const testResumePath = path.join(resumesDir, "Test_Resume.txt");
const resumeContent = `
John Doe
Software Engineer
New York, NY
john.doe@example.com

SKILLS
- JavaScript, TypeScript, React, Next.js
- Node.js, Express, PostgreSQL
- AWS, Docker, CI/CD

EXPERIENCE
Senior Software Engineer
ABC Tech, New York, NY
2020 - Present
- Developed and maintained web applications using React and Node.js
- Implemented CI/CD pipelines using GitHub Actions
- Optimized database queries resulting in 30% performance improvement

Software Engineer
XYZ Solutions, San Francisco, CA
2018 - 2020
- Built RESTful APIs using Express and PostgreSQL
- Developed frontend components using React and Redux
- Collaborated with UX designers to implement responsive designs

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley
2014 - 2018
`;

fs.writeFileSync(testResumePath, resumeContent);
console.log(`Created test resume at ${testResumePath}`);
