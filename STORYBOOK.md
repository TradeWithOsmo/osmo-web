# Storybook

Storybook is installed but no stories have been created yet.

## Creating Your First Story

To create a story for a component:

1. Create a `.stories.tsx` file in the `src/stories` directory
2. Use the Storybook API to define your story

Example:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import YourComponent from '../components/YourComponent'

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof YourComponent>

export const Default: Story = {
  args: {
    // component props
  },
}
```

## Running Storybook

```bash
npm run storybook
```

Opens at `http://localhost:6006`

## Building Storybook for Production

```bash
npm run build-storybook
```
