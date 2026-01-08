import type { Meta, StoryObj } from '@storybook/react';
import MarketDetails from './MarketDetails';

const meta = {
    title: 'Components/MarketDetails',
    component: MarketDetails,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#12000A' },
                { name: 'light', value: '#ffffff' },
            ],
        },
    },
    tags: ['autodocs'],
    argTypes: {
        onToggleFavorite: { action: 'toggled favorite' }
    },
} satisfies Meta<typeof MarketDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const PositiveChange: Story = {
    args: {
        data: {
            symbol: 'BTC-USD',
            price: '$65,430.00',
            volume24h: '$25,123,543',
            change24h: '+1234.50',
            change24hPercent: '+1.92%',
            markPrice: '$65,432.10',
            openInterest: '$5.2B',
            funding8h: '+0.0100%',
        },
        isFavorite: false,
    },
};

export const NegativeChange: Story = {
    args: {
        data: {
            symbol: 'SOL-USD',
            price: '$123.45',
            volume24h: '$500,000',
            change24h: '-5.23',
            change24hPercent: '-4.12%',
            markPrice: '$123.50',
            openInterest: '$900K',
            funding8h: '-0.0200%',
        },
    },
};
