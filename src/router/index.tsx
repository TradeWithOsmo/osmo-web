import React from 'react';
import {
    Trade,
    Arena,



    Portfolio,
    Usage,


    Points,
    Leaderboard,
    Faucet
} from '../pages';

interface AppRouterProps {
    route: string;
}

export const AppRouter: React.FC<AppRouterProps> = ({ route }) => {
    // Normalizing route to lower case just in case, though hrefs are usually strict
    const currentPath = route.split('?')[0].toLowerCase();

    if (currentPath === '/trade' || currentPath === '/') return <Trade />;
    if (currentPath === '/arena') return <Arena />;



    if (currentPath === '/portfolio') return <Portfolio />;
    if (currentPath === '/usage') return <Usage />;
    if (currentPath === '/faucet') return <Faucet />;


    if (currentPath === '/points') return <Points />;
    if (currentPath === '/leaderboard') return <Leaderboard />;
    return <Trade />; // Default to Trade
};
