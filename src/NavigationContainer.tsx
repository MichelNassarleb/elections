import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HomeScreen } from './screens/Home/HomeScreen';
import { VotersScreen } from './screens/Voters/VotersScreen';
import { VoteDetails } from './screens/VoteDetails/VoteDetails';
import { ForecastResults } from './screens/ForecastResults/ForecastResults';
import { NonVotersScreen } from './screens/NonVoters/NonVoters';

export default function NavigationContainer() {
    return (
        <Router>
            <div style={styles.navbar}>
                <Link to="/" style={styles.link}>🏠 Home</Link>
                <Link to="/voters" style={styles.link}>🗳️ Voters</Link>
                <Link to="/non-voters" style={styles.link}>🚫 Non Voters</Link>
                <Link to="/forecast-results" style={styles.link}>📊 Forecast Results</Link>
            </div>

            <div style={styles.content}>
                <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/voters" element={<VotersScreen />} />
                    <Route path="/non-voters" element={<NonVotersScreen />} />
                    <Route path="/vote-details/:voterId" element={<VoteDetails />} />
                    <Route path="/forecast-results" element={<ForecastResults />} />
                </Routes>
            </div>
        </Router>
    );
}

const styles: Record<string, React.CSSProperties> = {
    navbar: {
        display: 'flex',
        gap: '20px',
        padding: '15px 30px',
        backgroundColor: '#007bff',
        color: 'white',
        fontSize: 18,
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    linkActive: {
        textDecoration: 'underline',
    },
    content: {
        padding: '30px',
    },
};
