import React from 'react';
import {
    Trade,
    Autos,

    Portfolio,


    Points,
    Leaderboard
} from '../pages';

interface AppRouterProps {
    route: string;
}

export const AppRouter: React.FC<AppRouterProps> = ({ route }) => {
    // Normalizing route to lower case just in case, though hrefs are usually strict
    const currentPath = route.split('?')[0].toLowerCase();

    if (currentPath === '/trade' || currentPath === '/') return <Trade />;
    if (currentPath === '/autos') return <Autos />;

    if (currentPath === '/portfolio') return <Portfolio />;


    if (currentPath === '/points') return <Points />;
    if (currentPath === '/leaderboard') return <Leaderboard />;

    return <Trade />; // Default to Trade
};
