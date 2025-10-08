# PAI Command System

The PAI Command System provides a flexible framework for creating custom commands, scripts, and automation tools that integrate seamlessly with the PAI infrastructure.

## 🏗️ Architecture Overview

The command system consists of three main components:

1. **Commands** - Standalone executable scripts and tools
2. **Hook Integration** - Commands triggered by system events
3. **Dynamic Loading** - Commands loaded based on user intent

## 📁 Directory Structure

```
${PAI_DIR}/commands/
├── *.md                    # Command documentation
├── *.ts                    # TypeScript implementations
├── *.sh                    # Shell script implementations
└── *.js                    # JavaScript implementations
```

## 🔧 Command Types

### 1. Standalone Commands

Independent tools that can be executed directly:

```bash
# TypeScript commands (using Bun runtime)
bun ${PAI_DIR}/commands/command-name.ts [args]

# Shell commands
bash ${PAI_DIR}/commands/command-name.sh [args]
```

### 2. Hook-Triggered Commands

Commands automatically executed by the PAI hook system:

- **UserPromptSubmit**: Triggered when user submits a prompt
- **SessionStart**: Executed at session initialization
- **Stop**: Run when session ends
- **PreCompact**: Triggered before context compression
- **SubagentStop**: Executed when subagent tasks complete

### 3. Dynamic Commands

Commands loaded based on semantic analysis of user intent via the `load-dynamic-requirements` system.

## 📝 Command Structure: Executable Markdown

PAI uses a powerful "executable markdown" pattern. A single `.md` file serves as **both** the documentation and the executable script. This keeps documentation and implementation tightly coupled.

An executable command file has three parts:

1.  **Shebang**: The file must start with `#!/usr/bin/env bun` to make it executable.
2.  **Documentation**: Standard markdown explaining the command's purpose, usage, etc. This is what you read.
3.  **Code Block**: A ` ```typescript ` block containing the TypeScript code that will be executed by `bun`.

### Example Executable Markdown File (`your-command.md`)

```markdown
#!/usr/bin/env bun

# Your Command Title

## Purpose
A clear description of what this command does.

## Usage
```bash
# Run the command directly
bun /path/to/commands/your-command.md

# Run with arguments
bun /path/to/commands/your-command.md --arg value
```

---

```typescript
// All TypeScript code goes inside this block
import { $ } from 'bun';

console.log('This command is running!');

// You can access command-line arguments
const args = process.argv.slice(2);
console.log('Arguments:', args);

async function main() {
  await $`echo Hello from Bun!`;
}

main().catch(console.error);
```

## 🚀 Creating New Commands

### Step 1: Create Your Executable Markdown File

Create a single new file: `${PAI_DIR}/commands/your-command.md`.

### Step 2: Add Content

Build the file with the three required parts:

1.  **Shebang**: Add `#!/usr/bin/env bun` to the very first line.
2.  **Documentation**: Write clear markdown documentation, including `# Title`, `## Purpose`, and `## Usage` sections.
3.  **Code**: Add a ` ```typescript ` block and write your command's logic inside it.

### Step 3: Make it Executable

Open a terminal and run `chmod +x` on your new file:

```bash
chmod +x ${PAI_DIR}/commands/your-command.md
```

### Step 4: Test Your Command

Execute your command directly to test it:

```bash
bun ${PAI_DIR}/commands/your-command.md
```


## 🔗 Integration Points

### Environment Variables

Commands should use these PAI environment variables:

- `PAI_DIR`: PAI configuration directory
- `ELEVENLABS_API_KEY`: Voice synthesis API key
- `PORT`: Voice server port (default: 8888)

### Standard Directories

Commands commonly interact with:

- `${PAI_DIR}/context/`: Context files and learnings
- `${PAI_DIR}/hooks/`: Hook scripts
- `${HOME}/Projects/`: Project-specific contexts
- `${HOME}/Library/Logs/`: System logs

### Hook Integration

To integrate with hooks, add command to `${PAI_DIR}/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun ${PAI_DIR}/commands/your-command.ts"
          }
        ]
      }
    ]
  }
}
```

## 📋 Existing Commands

### capture-learning
Captures comprehensive problem-solving narratives from work sessions.

**Usage**: `bun ${PAI_DIR}/commands/capture-learning.ts`
**Output**: `${PAI_DIR}/context/learnings/YYYY-MM-DD-problem.md`

### load-dynamic-requirements
Dynamically loads context and agents based on user intent.

**Usage**: Triggered automatically via UserPromptSubmit hook
**Function**: Semantic analysis and context loading

### web-research
Perplexity AI integration for web research queries.

**Usage**: Via API calls with PERPLEXITY_API_KEY
**Function**: External research and information gathering

## 🎯 Best Practices

### 1. Error Handling
```typescript
try {
    // Command logic
} catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
}
```

### 2. User Feedback
```typescript
console.log('✅ Command completed successfully');
console.log(`📁 Output saved to: ${outputPath}`);
```

### 3. Argument Validation
```typescript
if (process.argv.length < 3) {
    console.error('Usage: bun command.ts <required-arg>');
    process.exit(1);
}
```

### 4. Path Handling
```typescript
const outputDir = path.join(PAI_DIR, 'context', 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
```

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Command not found | Check file permissions and shebang |
| PAI_DIR undefined | Set environment variable in shell |
| Import errors | Verify Bun installation and dependencies |
| Hook not triggering | Check settings.json configuration |

### Debugging Commands

```bash
# Test command directly
bun ${PAI_DIR}/commands/command-name.ts

# Check environment
echo $PAI_DIR

# Verify permissions
ls -la ${PAI_DIR}/commands/

# Check hook configuration
cat ${PAI_DIR}/settings.json | jq '.hooks'
```

## 🚀 Advanced Features

### Interactive Commands
Use readline for user input:

```typescript
import * as readline from 'readline';

async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
```

### Voice Integration
Commands can trigger voice notifications:

```typescript
const notification = {
    title: "Command Complete",
    message: "Your command has finished successfully",
    voice_enabled: true
};

// Send to voice server
fetch('http://localhost:8888/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification)
});
```

---

*The PAI Command System enables powerful automation and customization while maintaining simplicity and consistency across the infrastructure.*
