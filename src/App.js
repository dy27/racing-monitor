import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RaceList from './RaceList';
import RaceDetails from './RaceDetails';

const App = () => {
  const [view, setView] = useState('raceList');
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [odds, setOdds] = useState([]);

  // Dummy values for testing
  const dummyRaces = [
    { id: 1, name: 'Race 1' },
    { id: 2, name: 'Race 2' },
    { id: 3, name: 'Race 3' },
  ];

  const dummyOdds = [
    { id: 1, name: 'Horse A', odds: 2.5 },
    { id: 2, name: 'Horse B', odds: 3.0 },
    { id: 3, name: 'Horse C', odds: 4.5 },
  ];

  useEffect(() => {
    // For testing, use dummy values instead of API calls
    setRaces(dummyRaces);
  }, []);

  useEffect(() => {
    // For testing, use dummy values instead of API calls
    setOdds(dummyOdds);
  }, [selectedRace]);

  const handleRaceClick = (raceId) => {
    setView('raceDetails');
    setSelectedRace(raceId);
  };

  const handleBackButtonClick = () => {
    setView('raceList');
    setSelectedRace(null);
  };

  return (
    <div>
      <h1>Horse Racing Odds</h1>
      {view === 'raceList' && (
        <RaceList races={races} onRaceClick={handleRaceClick} />
      )}
      {view === 'raceDetails' && (
        <RaceDetails odds={odds} onBackButtonClick={handleBackButtonClick} />
      )}
    </div>
  );
};

export default App;
