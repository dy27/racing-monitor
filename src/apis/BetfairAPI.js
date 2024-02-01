const cookie = require('cookie');
var setCookie = require('set-cookie-parser');
const axios = require('axios');

const https = require('https');
const querystring = require('querystring');

class RequestSession {
  constructor() {
    this.cookies = new Map();
  }

  printCookies() {
    console.log(this.cookies);
  }
  
  async request(method, url, headers, data, params, maxRedirects = 20, throwErrorOnMaxRedirects = false) {
    // Check and handle null or undefined values for headers, data, and params
    headers = headers || {};
    data = data || null;
    params = params || null;

    // Add params to the URL if present
    const queryString = params !== null ? `?${new URLSearchParams(params).toString()}` : '';
    const fullUrl = `${url}${queryString}`;

    // Define a recursive function to handle redirects
    const handleRedirect = (redirectUrl, redirectCount) => {
      return new Promise((resolve, reject) => {
        

        const cookieHeader = [...this.cookies.entries()]
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        const options = {
          method,
          headers: {
            ...headers,
            // 'Content-Length': Buffer.byteLength(data),
            'Cookie': cookieHeader,
          },
        };

        const req = https.request(redirectUrl, options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            console.log(res.statusCode);
            // console.log(responseData);

            // Get the cookies from the response
            const cookies = res.headers['set-cookie'];

            if (cookies) {
              cookies.forEach(cookieStr => {
                const parsedCookie = cookie.parse(cookieStr)
                const cookieName = Object.keys(parsedCookie)[0];
                const cookieValue = parsedCookie[cookieName];
                this.cookies.set(cookieName, cookieValue);
              });
            }

            // Check if the response is a redirect (3xx status code)
            if (300 <= res.statusCode && res.statusCode < 400) {
              console.log('REDIRECT');

              // Get the redirect URL from the Location header
              const nextRedirectUrl = res.headers.location;
              console.log(nextRedirectUrl);

              if (redirectCount >= maxRedirects) {
                if (throwErrorOnMaxRedirects) {
                  reject(new Error('Maximum redirects exceeded'));
                } else {
                  resolve(responseData);
                }
                return;
              }

              if (nextRedirectUrl) {
                // Call the function recursively with the new redirect URL
                handleRedirect(nextRedirectUrl, redirectCount + 1)
                  .then(resolve)
                  .catch(reject);
              } else {
                console.log("Redirect response is missing the Location header.");
                resolve(responseData);
              }
            } else {
              // Resolve the promise with the final response data
              resolve(responseData);
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        if (data) {
          req.write(data);
        }

        req.end();
      });
    };

    // Start the first request
    return handleRedirect(fullUrl, 0);
  }
}



class BetfairAPI {
  constructor() {
    this.LOGIN_API = 'https://identitysso.betfair.com.au/api/login';
    this.MARKET_DATA_API = 'https://ero.betfair.com.au/www/sports/exchange/readonly/v1/bymarket';
    this.EXCHANGE_API = 'https://scan-inbf.betfair.com.au/www/sports/navigation/facet/v1/search?_ak=nzIFcwyWhrlwYMrh&alt=json';
    this.DEFAULT_FILTER = {
      marketBettingTypes: [
        'ASIAN_HANDICAP_SINGLE_LINE',
        'ASIAN_HANDICAP_DOUBLE_LINE',
        'ODDS',
        'LINE',
      ],
      productTypes: ['EXCHANGE'],
      contentGroup: {
        language: 'en',
        regionCode: 'NZAUS',
      },
      selectBy: 'RANK',
      maxResults: 0,
    };
    // this.session = new Map();
    this.session = new RequestSession();
  }

  createMarketFilter({
    textQuery = null,
    eventTypeIds = null,
    eventIds = null,
    competitionIds = null,
    marketIds = null,
    venues = null,
    bspOnly = null,
    turnInPlayEnabled = null,
    inPlayOnly = null,
    marketBettingTypes = null,
    marketCountries = null,
    marketTypeCodes = null,
    marketStartTime = null,
    withOrders = null,
    raceTypes = null,
  }) {
    const args = { textQuery, eventTypeIds, eventIds, competitionIds, marketIds, venues, bspOnly, turnInPlayEnabled, inPlayOnly, marketBettingTypes, marketCountries, marketTypeCodes, marketStartTime, withOrders, raceTypes };

    function toCamelCase(snakeStr) {
      const components = snakeStr.split('_');
      return components[0] + components.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
    }

    const marketFilter = { ...this.DEFAULT_FILTER, ...Object.fromEntries(Object.entries(args).filter(([_, v]) => v !== null).map(([k, v]) => [toCamelCase(k), v])) };
    return marketFilter;
  }

  loggedIn(text) {
    if (text.includes('loggedIn&quot;:true')) {
        return 1;
    } else if (text.includes('loggedIn&quot;:false')) {
        return -1;
    }
    return 0;
  }

  async login(username, password) {

    const https = require('https');
    const querystring = require('querystring');

    let url = 'https://identitysso.betfair.com.au/api/login';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    };

    const payload = querystring.stringify({
      'product': 'exchange-eds',
      'redirectMethod': 'GET',
      'url': 'https://www.betfair.com.au/exchange/plus',
      'submitForm': 'true',
      'username': username,
      'password': password,
    });


    const res = await this.session.request('POST', this.LOGIN_API, headers, payload, null, 0);
    console.log(res);

    this.session.printCookies()
  }
  
  isLoggedIn() {
    const cookiesDict = this.session;
    console.log(cookiesDict);
    return cookiesDict.has('loggedIn') && cookiesDict.get('loggedIn') === 'true';
  }

  async listEventTypes(returnMap = true, inverseMapping = false) {
    const payloadDict = {
      filter: {},
      textQuery: null,
      facets: [
        {
          type: 'EVENT_TYPE',
          maxValues: 0,
          skipValues: 0,
          applyNextTo: 0,
        },
      ],
      currencyCode: 'AUD',
      locale: 'en_GB',
    };
    const payload = JSON.stringify(payloadDict);
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await this.session.request('POST', this.EXCHANGE_API, headers, payload);
    const responseDict = JSON.parse(response);
    const results = Object.entries(responseDict.attachments.eventTypes).map(([key, resultDict]) => [key, resultDict.name]);

    if (returnMap) {
      const map = new Map();
      results.forEach(([eventId, eventName]) => {
        if (inverseMapping) {
          map.set(eventId, eventName);
        } else {
          map.set(eventName, eventId);
        }
      })
      return map;
    } else {
      return results;
    }
  }

  async listCompetitions(filter = null) {
    const payloadDict = {
      filter: this.createMarketFilter({}),
      facets: [
        {
          type: 'COMPETITION',
          maxValues: 0,
          skipValues: 0,
          applyNextTo: 0,
        },
      ],
      currencyCode: 'AUD',
      locale: 'en_GB',
    };
    if (filter !== null) {
      payloadDict.filter = { ...payloadDict.filter, ...filter };
    }
    const payload = JSON.stringify(payloadDict);
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await this.session.request('POST', this.EXCHANGE_API, headers, payload);
    const responseDict = JSON.parse(response);
    // console.log(responseDict);
    const results = responseDict.facets[0].values.map(resultDict => responseDict.attachments.competitions[resultDict.key.competitionId]);
    return results;
  }

  async listEvents(filter = null) {
    const payloadDict = {
      filter: this.createMarketFilter({}),
      facets: [
        {
          type: 'EVENT',
          maxValues: 0,
          skipValues: 0,
          applyNextTo: 0,
        },
      ],
      currencyCode: 'AUD',
      locale: 'en_GB',
    };
    if (filter !== null) {
      payloadDict.filter = { ...payloadDict.filter, ...filter };
    }
    const payload = JSON.stringify(payloadDict);
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await this.session.request('POST', this.EXCHANGE_API, headers, payload);
    const responseDict = JSON.parse(response);
    const results = responseDict.facets[0].values.map(resultDict => responseDict.attachments.events[resultDict.key.eventId]);
    return results;
  }

  async listMarketTypes(filter = null) {
    const payloadDict = {
      filter: this.createMarketFilter({}),
      facets: [
        {
          type: 'MARKET_TYPE',
          maxValues: 0,
          skipValues: 0,
          applyNextTo: 0,
        },
      ],
      currencyCode: 'AUD',
      locale: 'en_GB',
    };
    if (filter !== null) {
      payloadDict.filter = { ...payloadDict.filter, ...filter };
    }
    const payload = JSON.stringify(payloadDict);
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await this.session.request('POST', this.EXCHANGE_API, headers, payload);
    const responseDict = JSON.parse(response);
    const results = responseDict.facets[0].values.map(resultDict => resultDict.value);
    return results;
  }

  async listMarketCatalogue(filter = null) {
    const payloadDict = {
      filter: this.createMarketFilter({}),
      facets: [
        {
          type: 'MARKET',
          maxValues: 0,
          skipValues: 0,
          applyNextTo: 0,
        },
      ],
      currencyCode: 'AUD',
      locale: 'en_GB',
    };
    if (filter !== null) {
      payloadDict.filter = { ...payloadDict.filter, ...filter };
    }
    const payload = JSON.stringify(payloadDict);
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await this.session.request('POST', this.EXCHANGE_API, headers, payload);
    const responseDict = JSON.parse(response);
    const results = responseDict.facets[0].values.map(resultDict => responseDict.attachments.markets[resultDict.key.marketId]);
    return results;
  }

  async getMarkets(marketIdList, reqBatchSize = 33, multithreaded = false) {
    const resultArray = [];
    const nBatches = reqBatchSize === 0 ? 1 : Math.ceil(marketIdList.length / reqBatchSize);
    for (let i = 0; i < nBatches; i++) {
      const marketIdBatch = marketIdList.slice(reqBatchSize * i, reqBatchSize * (i + 1));
      const params = {
        _ak: 'nzIFcwyWhrlwYMrh',
        alt: 'json',
        currencyCode: 'AUD',
        locale: 'en_GB',
        marketIds: marketIdBatch.join(','),
        rollupLimit: '5',
        rollupModel: 'STAKE',
        types: 'MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_SP',
      };
      const headers = {};
      const responseText = await this.session.request('GET', this.MARKET_DATA_API, headers, null, params);
      // console.log(responseText);
      const timestamp = new Date().toISOString();
      const responseDict = JSON.parse(responseText);
      const marketDict = {};
      responseDict.eventTypes[0].eventNodes.forEach(event => {
        event.marketNodes.forEach(market => {
          market._timestamp = timestamp;
          marketDict[market.marketId] = market;
        });
      });
      resultArray.push(...marketIdBatch.map(marketId => marketDict[marketId]));
    }
    return resultArray;
  }

  customQuery(filter, facets) {
    throw new Error('Not implemented');
  }

  _printDict(dict, sortKeys = false) {
    console.log(JSON.stringify(dict, null, 4));
  }

  // async request(method, url, headers, data, params) {
  //   // Check and handle null or undefined values for headers, data, and params
  //   headers = headers || {};
  //   data = data || null;
  //   params = params || null;

  //   // Add cookies to the request headers
  //   if (this.session.size > 0) {
  //       const cookieHeader = [...this.session.entries()]
  //           .map(([name, value]) => `${name}=${value}`)
  //           .join('; ');
  //       headers = { ...headers, 'Cookie': cookieHeader };
  //   }

  //   // Construct the request options
  //   const requestOptions = {
  //       method,
  //       headers,
  //   };

  //   // Add data to the request if present
  //   if (data !== null) {
  //       requestOptions.body = data;
  //   }

  //   // Add params to the URL if present
  //   const queryString = params !== null ? `?${new URLSearchParams(params).toString()}` : '';
  //   const fullUrl = `${url}${queryString}`;

  //   // Log the request details
  //   console.log('Request Details:', {
  //       method,
  //       url: fullUrl,
  //       headers,
  //       data,
  //       params,
  //   });

  //   try {
  //       // Make the fetch request
  //       const response = await fetch(fullUrl, requestOptions);

  //       // Log the response details
  //       console.log('Response Details:', {
  //         status: response.status,
  //         headers: response.headers,
  //         data: await response.text(),
  //       });

  //       // Extract and store cookies from the response
  //       const parsedCookies = setCookie.parse(response);

  //       if (parsedCookies) {
  //           // Update session with parsed cookies
  //           parsedCookies.forEach(cookie => {
  //               this.session.set(cookie.name, cookie.value);
  //           });
  //       }

  //       return response;
  //   } catch (error) {
  //       // Log any errors
  //       console.error('Request Error:', error.message);
  //       throw error;
  //   }
  // }


}


module.exports = { BetfairAPI };

// // Example usage:
// const betfairApi = new BetfairAPI();
// await betfairApi.login('yourUsername', 'yourPassword');
// const eventTypes = await betfairApi.listEventTypes();
// console.log('Event Types:', eventTypes);
// const competitions = await betfairApi.listCompetitions();
// console.log('Competitions:', competitions);
// const events = await betfairApi.listEvents();
// console.log('Events:', events);
// const marketTypes = await betfairApi.listMarketTypes();
// console.log('Market Types:', marketTypes);
// const marketCatalogue = await betfairApi.listMarketCatalogue();
// console.log('Market Catalogue:', marketCatalogue);
// const marketIds = ['1.123456789', '1.234567890'];
// const markets = await betfairApi.getMarkets(marketIds);
// console.log('Markets:', markets);
