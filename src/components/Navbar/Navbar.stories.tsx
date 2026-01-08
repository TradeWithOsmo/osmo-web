import type { Meta, StoryObj } from '@storybook/react'
import { Navbar, type NavbarProps } from './Navbar'

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

const defaultNavItems = [
  { label: 'Trade', href: '/trade' },
  { label: 'Market', href: '/market' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Points', href: '/points' },
  { label: 'More', href: '/more' },
]

export const Default: Story = {
  args: {
    navItems: defaultNavItems,
  } as NavbarProps,
}

export const WithActiveItem: Story = {
  args: {
    navItems: [
      { label: 'Trade', href: '/trade', isActive: true },
      { label: 'Market', href: '/market' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Points', href: '/points' },
      { label: 'More', href: '/more' },
    ],
  } as NavbarProps,
}

export const Minimal: Story = {
  args: {
    navItems: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ],
  } as NavbarProps,
}

export const WithoutNavItems: Story = {
  args: {},
}

export const Interactive: Story = {
  args: {
    navItems: defaultNavItems,
    onNavClick: (href: string) => {
      console.log(`Navigated to: ${href}`)
    },
  } as NavbarProps,
}

export const WithNotifications: Story = {
  args: {
    navItems: defaultNavItems,
    hasNotifications: true,
  } as NavbarProps,
}
