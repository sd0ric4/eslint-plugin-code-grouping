# eslint-plugin-code-grouping

ESLint plugin for grouping related code blocks with special comments

## Installation

```bash
npm install eslint-plugin-code-grouping --save-dev
# or
yarn add eslint-plugin-code-grouping --dev
# or
pnpm add -D eslint-plugin-code-grouping
```

## Usage

Add `code-grouping` to the plugins section of your `.eslintrc` configuration file:

```json
{
  "plugins": ["code-grouping"],
  "rules": {
    "code-grouping/group-spacing": [
      "error",
      {
        "blankLinesBetweenGroups": 1,
        "blankLinesWithinGroups": 0
      }
    ]
  }
}
```

## Rules

### group-spacing

This rule enforces consistent blank line spacing between code groups marked with special comments.

#### Options

- `blankLinesBetweenGroups` (default: 1): Number of blank lines required between different groups
- `blankLinesWithinGroups` (default: 0): Number of blank lines required between items in the same group

#### Example

```javascript
// @group start: render-components
const RenderText = React.memo(function RenderText() {
  // ...
});

const RenderContent = React.memo(function RenderContent() {
  // ...
});
// @group end: render-components

// There will be a blank line here

// @group start: interactive-components
const UserInput = React.memo(function UserInput() {
  // ...
});
// @group end: interactive-components
```
