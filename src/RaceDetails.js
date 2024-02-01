import React from 'react';
import OddsTable from './OddsTable';

const RaceDetails = ({ odds, onBackButtonClick }) => {
  return (
    <div>
      <h2>Race Details</h2>
      <button onClick={onBackButtonClick}>Back to Race List</button>
      <OddsTable odds={odds} />
    </div>
  );
};

export default RaceDetails;
