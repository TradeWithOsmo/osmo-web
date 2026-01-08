import type { Meta, StoryObj } from '@storybook/react';
import TradingChart from './index';

const meta: Meta<typeof TradingChart> = {
  title: 'Components/TradingChart',
  component: TradingChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced TradingView chart component with real-time data support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    symbol: {
      control: 'text',
      description: 'Trading symbol (e.g., BTCUSDT, ETHUSDT)',
    },
    interval: {
      control: 'select',
      options: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
      description: 'Chart time interval',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Chart theme',
    },
    height: {
      control: 'text',
      description: 'Chart container height',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbol: 'BTCUSDT',
    interval: '5',
    theme: 'dark',
    height: '600px',
  },
};

export const LightTheme: Story = {
  args: {
    symbol: 'ETHUSDT',
    interval: '15',
    theme: 'light',
    height: '600px',
  },
};

export const LargeChart: Story = {
  args: {
    symbol: 'USDT',
    interval: '1',
    theme: 'dark',
    height: '800px',
  },
};

export const DailyInterval: Story = {
  args: {
    symbol: 'BTCUSDT',
    interval: '1D',
    theme: 'dark',
    height: '600px',
  },
};