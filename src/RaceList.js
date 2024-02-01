import React from 'react';

const RaceList = ({ races, onRaceClick }) => {
  return (
    <div>
      <h2>Race List</h2>
      <ul>
        {races.map((race) => (
          <li key={race.id} onClick={() => onRaceClick(race.id)}>
            {race.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RaceList;
