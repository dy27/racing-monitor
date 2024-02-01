const fs = require('fs').promises;

// Import the BetfairAPI class
const { BetfairAPI } = require('./BetfairAPI'); // Adjust the path accordingly

async function testBetfairAPI() {
    // try {
        // Load credentials from JSON file
        const credentials = await fs.readFile('credentials.json', 'utf-8');
        const { username, password } = JSON.parse(credentials);

        // Initialize BetfairAPI
        const api = new BetfairAPI();

        // Login
        const status = await api.login(username, password);

        // const markets = api.getMarkets(['1.224160252']);
        // console.log(markets);

        const eventTypeMap = await api.listEventTypes()
        console.log('Event Types')
        console.log(eventTypeMap);

        const horseRacingFilter = api.createMarketFilter({ eventTypeIds: [eventTypeMap.get('Horse Racing')] });
        console.log(horseRacingFilter);

        var results = await api.listEvents(horseRacingFilter);
        console.log(results);

        const tennisFilter = api.createMarketFilter({ eventTypeIds: [eventTypeMap.get('Tennis')] });

        results = await api.listCompetitions(tennisFilter);
        console.log(results);

        

        // if (status) {
        //     console.log('Login successful');

        //     // Create market filter for Horse Racing
        //     const horseRacingFilter = api.createMarketFilter({ textQuery: 'Horse Racing' });

        //     // List market catalog for Horse Racing
        //     const results = await api.listMarketCatalogue(horseRacingFilter);
        //     console.log('Market Catalog Results:', results);
        // } else {

        //     console.log('Login failed');
        // }
    // } catch (error) {
    //     console.error('Error:', error.message);
    // }
}

// Run the test
testBetfairAPI();