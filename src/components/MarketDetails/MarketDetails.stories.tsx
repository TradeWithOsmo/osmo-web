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
        isFavorite: false,
    },
};

export const NegativeChange: Story = {
    args: {
        isFavorite: true,
    },
};
