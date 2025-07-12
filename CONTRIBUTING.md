# Contributing to Hubstaff Clone

Thank you for your interest in contributing to the Hubstaff Clone project! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### 1. Fork the Repository

1. Fork the project on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/hubstaff-clone.git
   cd hubstaff-clone
   ```

### 2. Set Up Development Environment

Follow the setup instructions in [README.md](README.md) to set up your development environment.

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-project-templates`
- `bugfix/time-tracking-timer-issue`
- `improvement/dashboard-performance`

### 4. Make Your Changes

#### Backend Changes
- Follow Python PEP 8 style guidelines
- Add type hints to function signatures
- Include docstrings for functions and classes
- Write unit tests for new functionality
- Update API documentation if adding new endpoints

#### Frontend Changes
- Follow React best practices and hooks patterns
- Use TypeScript for type safety (if applicable)
- Maintain responsive design principles
- Add proper error handling
- Write component tests

### 5. Testing

Before submitting your changes:

```bash
# Run backend tests
cd backend
source venv/bin/activate
python -m pytest
python backend_test.py

# Run frontend tests
cd ../frontend
yarn test

# Run full test suite
cd ..
./scripts/test.sh
```

### 6. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add project template functionality

- Add template model and API endpoints
- Implement template selection in UI
- Add tests for template operations
- Update documentation"
```

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub with:
- Clear title and description
- Reference any related issues
- Include screenshots for UI changes
- List breaking changes (if any)

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
```python
# Use type hints
def create_project(project_data: ProjectCreate, user_id: str) -> Project:
    """Create a new project for the user."""
    pass

# Use descriptive variable names
def calculate_productivity_score(
    activity_level: float, 
    hours_worked: float,
    target_hours: float
) -> float:
    """Calculate productivity score based on activity and hours."""
    pass
```

#### JavaScript/React (Frontend)
```javascript
// Use descriptive component names
const ProjectCard = ({ project, onEdit, onDelete }) => {
  // Component logic here
};

// Use hooks properly
const useTimeTracking = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  
  // Hook logic here
  
  return { isRunning, duration, start, stop };
};
```

### Database Guidelines

- Use proper indexes for performance
- Validate data at the model level
- Use aggregation pipelines for complex queries
- Handle errors gracefully

```python
# Good: Using aggregation for analytics
pipeline = [
    {"$match": {"user_id": user_id}},
    {"$group": {"_id": "$project_id", "total_hours": {"$sum": "$duration"}}},
    {"$sort": {"total_hours": -1}}
]
```

### API Guidelines

- Use proper HTTP status codes
- Include comprehensive error messages
- Add request/response validation
- Document all endpoints

```python
@router.post("/projects", response_model=Project, status_code=201)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new project.
    
    Args:
        project_data: Project creation data
        current_user: Currently authenticated user
        
    Returns:
        Created project object
        
    Raises:
        HTTPException: If project creation fails
    """
```

### UI/UX Guidelines

- Maintain responsive design
- Use consistent color scheme and spacing
- Provide loading states for async operations
- Include proper error handling and user feedback
- Follow accessibility guidelines (WCAG 2.1)

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment:** OS, browser, Node.js/Python versions
2. **Steps to reproduce:** Clear step-by-step instructions
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happens
5. **Screenshots:** If applicable
6. **Console logs:** Any error messages
7. **Additional context:** Any other relevant information

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Environment
- OS: [e.g., macOS 12.0, Windows 11, Ubuntu 20.04]
- Browser: [e.g., Chrome 96, Firefox 95]
- Node.js: [e.g., 16.13.0]
- Python: [e.g., 3.9.7]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable, add screenshots

## Console Logs
```
Any error messages from browser console or server logs
```

## Additional Context
Any other context about the problem
```

## 💡 Feature Requests

For feature requests, please:

1. Check if the feature already exists
2. Search existing issues/discussions
3. Provide detailed description and use case
4. Include mockups or examples if possible
5. Consider implementation complexity

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed? Who would use it?

## Proposed Solution
How do you envision this working?

## Alternatives Considered
Any alternative solutions or features considered?

## Additional Context
Any other context, screenshots, or examples
```

## 🔍 Code Review Process

### For Contributors
- Ensure your code follows the style guidelines
- Write clear commit messages
- Add tests for new functionality
- Update documentation as needed
- Be responsive to feedback

### For Reviewers
- Be constructive and helpful
- Focus on code quality, performance, and maintainability
- Suggest improvements rather than just pointing out problems
- Approve when ready, request changes when needed

## 📦 Release Process

### Version Numbers
We use Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Release notes prepared

## 🎯 Areas That Need Help

We welcome contributions in these areas:

### High Priority
- [ ] Mobile app development (React Native)
- [ ] Advanced analytics and reporting
- [ ] Performance optimizations
- [ ] Security auditing
- [ ] Automated testing improvements

### Medium Priority
- [ ] Additional integrations (Jira, Asana, etc.)
- [ ] Advanced project templates
- [ ] Improved notification system
- [ ] Dark mode theme
- [ ] Internationalization (i18n)

### Documentation
- [ ] API documentation improvements
- [ ] Video tutorials
- [ ] Deployment guides
- [ ] Architecture documentation

## 📞 Getting Help

If you need help with contributing:

1. **Documentation:** Check README.md and this guide
2. **Discussions:** Use GitHub Discussions for questions
3. **Issues:** Create an issue for bugs or feature requests
4. **Discord/Slack:** Join our community chat (if available)

## 🏆 Recognition

We appreciate all contributors! Contributors will be:
- Listed in the README.md
- Credited in release notes
- Invited to the contributors team (for regular contributors)

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Hubstaff Clone! 🚀