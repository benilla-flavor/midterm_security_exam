# 🚀 Git Repository Setup Guide

## Step-by-Step Instructions for GitHub/GitLab

### 1️⃣ Initialize Local Repository

```bash
# Navigate to your project directory (if not already there)
cd c:\xampp\htdocs\midterm_sec

# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Secure clinic appointment system with 18+ security controls"
```

### 2️⃣ Create Remote Repository

#### Option A: GitHub (Recommended)
1. Go to https://github.com/new
2. **Repository name**: `midterm_security_exam`
3. **Description**: Choose one of these:

**RECOMMENDED (100 chars):**
```
🔐 Secure-by-design healthcare appointment system with 18+ security controls - Web Security midterm project
```

**Alternatives:**
```
Production-ready clinic appointment system demonstrating defense-in-depth security: JWT auth, RBAC, encryption, audit logging, OWASP compliance
```

```
Healthcare web app with enterprise security: parameterized queries, bcrypt hashing, XSS/CSRF protection, rate limiting, comprehensive vulnerability analysis
```

4. **Privacy**: Choose Public or Private (your choice)
5. **DON'T** initialize with README (we already have one)
6. Click **Create repository**

#### Option B: GitLab
1. Go to https://gitlab.com/projects/new
2. Follow similar steps as above
3. Use the same repository name and description

### 3️⃣ Connect and Push to Remote

```bash
# Add remote repository (replace YOUR_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_USERNAME/midterm_security_exam.git

# For GitLab users:
# git remote add origin https://gitlab.com/YOUR_USERNAME/midterm_security_exam.git

# Push to remote repository
git push -u origin master
# OR if your default branch is "main":
# git push -u origin main
```

### 4️⃣ Configure Repository Settings

#### GitHub Settings:
1. Go to repository **Settings** tab
2. Under **General** → **Social preview**: Upload a screenshot of your app
3. Under **General** → **About** section (top right):
   - Click the gear icon ⚙️
   - Add **Topics** (press Enter after each):
     ```
     web-security
     cybersecurity
     healthcare
     appointment-system
     postgresql
     nodejs
     express
     react
     jwt-authentication
     bcrypt
     owasp
     security-audit
     vulnerability-analysis
     rbac
     xss-prevention
     csrf-protection
     sql-injection-prevention
     academic-project
     ```
   - Check ✅ "Use your GitHub repository"

#### Security Settings:
1. Go to **Settings** → **Security** → **Code security and analysis**
2. Enable **Dependency graph**
3. Enable **Dependabot alerts**
4. Enable **Dependabot security updates**

### 5️⃣ Add Team Members (if applicable)

```bash
# If working in a team, add collaborators:
# GitHub: Settings → Collaborators → Add people
# GitLab: Project → Members → Invite members
```

### 6️⃣ Protect Sensitive Files

**VERIFY** your `.gitignore` is working:

```bash
# Check that .env is ignored
git status

# You should NOT see .env in the list
# You SHOULD see .env.example
```

**Important files that should be tracked:**
- ✅ `.env.example` (safe template)
- ✅ All source code files
- ✅ All documentation files
- ✅ `package.json` and `package-lock.json`

**Files that should be ignored:**
- ❌ `.env` (contains secrets!)
- ❌ `node_modules/` (too large)
- ❌ Build artifacts
- ❌ Database dumps with real data

### 7️⃣ Create Release Tag (Optional but Recommended)

```bash
# After your first successful push, create a release tag
git tag -a v1.0.0 -m "Midterm submission - Complete secure clinic system"
git push origin v1.0.0
```

On GitHub, go to **Releases** → **Create a new release**:
- **Tag**: v1.0.0
- **Title**: "Web Security Midterm Submission"
- **Description**:
```markdown
## 📋 Submission Details

**Course**: Web Security
**Project**: Secure Clinic Appointment System
**Date**: [Your Submission Date]

### ✅ Deliverables Included
- Complete working application (React + Express + PostgreSQL)
- 18+ security controls implemented
- 7 comprehensive documentation files
- 14 security test procedures with evidence
- CVE analysis for all 7 tech stack components
- Demo script and presentation materials

### 🎯 Rubric Compliance: 100/100 Points

See [RUBRIC_COMPLIANCE.md](docs/RUBRIC_COMPLIANCE.md) for detailed scoring.

### 🚀 Quick Start
See [QUICK_START_REVIEWER.md](QUICK_START_REVIEWER.md) for 5-minute setup.
```

### 8️⃣ Verify Everything Looks Good

Visit your repository URL and check:
- ✅ README displays properly with badges
- ✅ Documentation links work (click on docs/ERD.md)
- ✅ `.github/SECURITY.md` is accessible
- ✅ Topics/tags are visible
- ✅ Description is visible under repo name
- ✅ No `.env` file visible (check file list)

### 9️⃣ Share Repository Link

Your repository URL format:
```
https://github.com/YOUR_USERNAME/midterm_security_exam
```

**For Submission:**
1. Copy this URL
2. Submit it according to your instructor's requirements
3. Ensure repository is **Public** if instructor needs access
4. If Private, invite instructor as collaborator

### 🔟 Future Updates

To push updates after submission:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin master
```

---

## 🛠️ Troubleshooting

### Problem: "fatal: remote origin already exists"
```bash
# Solution: Remove and re-add
git remote remove origin
git remote add origin YOUR_REPO_URL
```

### Problem: ".env file is showing in git status"
```bash
# Solution: It might already be tracked
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### Problem: "Repository not found"
```bash
# Solution: Check URL is correct
git remote -v

# Update if needed:
git remote set-url origin CORRECT_URL
```

### Problem: "Permission denied (publickey)"
```bash
# Solution: Use HTTPS instead of SSH, or set up SSH keys
# Use HTTPS URL format: https://github.com/username/repo.git
```

---

## 📋 Repository Checklist

Before submission, verify:
- [ ] Repository created with correct name
- [ ] Description added (visible under repo name)
- [ ] Topics/tags added (at least 8-10 tags)
- [ ] All files pushed successfully
- [ ] README displays correctly with badges
- [ ] Documentation links work
- [ ] `.env` is NOT in repository (verify!)
- [ ] `.env.example` IS in repository
- [ ] Security.md is accessible
- [ ] Release tag created (optional)
- [ ] Team members added as collaborators (if team project)
- [ ] Repository is Public OR instructor has access
- [ ] Repository URL shared with instructor

---

## 🎓 Ready for Submission!

Once all checkboxes are complete, you're ready to submit your repository URL.

**Your repository URL:**
```
https://github.com/YOUR_USERNAME/midterm_security_exam
```

Good luck with your presentation! 🚀
