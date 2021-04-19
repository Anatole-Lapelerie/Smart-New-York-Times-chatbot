'use strict';

const bodyparser = require('body-parser');
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const fastcsv = require('fast-csv'); // to write csv

const matcher = require('./matcher');
const config = require('./config');
const FBeamer = require('./fbeamer');
const nyt = require('./nytimes');

const server = express();
const PORT = process.env.PORT || 3000;
const FB = new FBeamer(config.FB);

let previous_data = {};

const replies = [
  {
    "content_type":"text",
    "title":"What are the news?",
    "payload":"<POSTBACK_PAYLOAD>"
  },{
    "content_type":"text",
    "title":"What are the most viewed articles of the last 3 days?",
    "payload":"<POSTBACK_PAYLOAD>"
  },{
    "content_type":"text",
    "title":"Tell me more about Joe Biden in Texas",
    "payload":"<POSTBACK_PAYLOAD>"
  }
]

const yes_no = [
  {
    "content_type":"text",
    "title":"Yes, I like this",
    "payload":"<POSTBACK_PAYLOAD>"
  },{
    "content_type":"text",
    "title":"No, I don't",
    "payload":"<POSTBACK_PAYLOAD>"
  }
];

let ratings = [{
  user_id: '00001',
  arts: '1',
  automobiles: '4',
  books: '1',
  business: '4',
  fashion: '1',
  food: '2',
  health: '2',
  home: '2',
  insider: '3',
  magazine: '1',
  movies: '3',
  nyregion: '4',
  obituaries: '1',
  opinion: '4',
  politics: '5',
  realestate: '5',
  science: '2',
  sports: '5',
  sundayreview: '2',
  technology: '3',
  theater: '1',
  travel: '4',
  upshot: '1',
  us: '5',
  world: '3'
},
{
  user_id: '00002',
  arts: '4',
  automobiles: '1',
  books: '4',
  business: '2',
  fashion: '3',
  food: '5',
  health: '3',
  home: '3',
  insider: '2',
  magazine: '5',
  movies: '4',
  nyregion: '2',
  obituaries: '2',
  opinion: '2',
  politics: '2',
  realestate: '1',
  science: '1',
  sports: '1',
  sundayreview: '4',
  technology: '2',
  theater: '4',
  travel: '3',
  upshot: '2',
  us: '3',
  world: '2'
},
{
  user_id: '00003',
  arts: '2',
  automobiles: '1',
  books: '1',
  business: '3',
  fashion: '2',
  food: '3',
  health: '2',
  home: '1',
  insider: '1',
  magazine: '3',
  movies: '3',
  nyregion: '1',
  obituaries: '1',
  opinion: '3',
  politics: '4',
  realestate: '1',
  science: '4',
  sports: '4',
  sundayreview: '2',
  technology: '3',
  theater: '1',
  travel: '5',
  upshot: '3',
  us: '3',
  world: '5'
}]; // Three different profiles of potential users

/* Impossible de lire un fichier csv, l'écriture fonctionne toutefois

let stream = fs.createReadStream('./recommendation/ratings.csv');

function streamToResults(stream) {
  const rows = [];
  stream.pipe(csv());
  stream.on('data', (row) => rows.push(row));
  stream.on('end', () => { console.log(rows); });
}

streamToResults(stream, (data) => {
  console.log(data);
});

results.push({
  user_id: '4',
  arts: '1',
  automobiles: '1',
  books: '1',
  business: '1',
  fashion: '1',
  food: '1',
  health: '1',
  home: '1',
  insider: '1',
  magazine: '1',
  movies: '1',
  nyregion: '1',
  obituaries: '1',
  opinion: '1',
  politics: '1',
  realestate: '1',
  science: '1',
  sports: '1',
  sundayreview: '1',
  technology: '1',
  theater: '1',
  travel: '1',
  upshot: '1',
  us: '1',
  world: '1'
});
*/

function userInRatings(user_id, ratings) {
  for (let i = 0; i < ratings.length; i++) {
    if (ratings[i].user_id === user_id) {
      return true;
    }
  }
  return false;
}

function modifyRatings(user_id, ratings, item, add) {
  if (item === "New York" || item === "NY") {
    item = "nyregion";
  }
  if (item === "United States" || item === "US" || item === "USA") {
    item = "us";
  }
item.replace(' ', '');
  for (let i = 0; i < ratings.length; i++) {
    if (ratings[i].user_id === user_id) {
      let new_rating = parseInt(ratings[i][item], 10) + add;
      ratings[i][item] = new_rating.toString();
      return ratings;
    }
  }
}

function getKeys(object) {
  var keys = [];
  for (var key in object) {
    keys.push(key);
  }
  return keys;
}

function writeCsv(name, content) {
  let ws = fs.createWriteStream(name);
  fastcsv
    .write(content, { headers: true })
    .pipe(ws);
}

function calculateItemsSimilarities(ratings) {
  let similarities = {
    "arts" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "automobiles" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "books" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "business" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "fashion" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "food" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "health" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "home" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "insider" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "magazine" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "movies" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "nyregion" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "obituaries" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "opinion" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "politics" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "realestate" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "science" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "sports" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "sundayreview" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "technology" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "theater" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "travel" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "upshot" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "us" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    },
    "world" : {
        "arts":0,
        "automobiles":0,
        "books":0,
        "business":0,
        "fashion":0,
        "food":0,
        "health":0,
        "home":0,
        "insider":0,
        "magazine":0,
        "movies":0,
        "nyregion":0,
        "obituaries":0,
        "opinion":0,
        "politics":0,
        "realestate":0,
        "science":0,
        "sports":0,
        "sundayreview":0,
        "technology":0,
        "theater":0,
        "travel":0,
        "upshot":0,
        "us":0,
        "world":0
    }
};
  let items = getKeys(ratings[0]).slice(1);
  let sum1 = 0; let sum2 = 0; let sum3 = 0; let sum4 = 0; let similarity = 0;
  for (let item1 in items) {
    for (let item2 in items) {
      sum1 = 0; sum2 = 0; sum3 = 0;
      for (let user in ratings) {
        sum1 = sum1 + parseInt(ratings[user][items[item1]], 10) * parseInt(ratings[user][items[item2]], 10);
        sum2 = sum2 + parseInt(ratings[user][items[item1]], 10);
        sum3 = sum3 + parseInt(ratings[user][items[item2]], 10);
      }
      sum4 = Math.sqrt(sum2) * Math.sqrt(sum3);
      similarity = (sum1 / sum4).toPrecision(3);
      similarities[items[item1]][items[item2]] = similarity.toString();
    }
  }
  return similarities;
}

function calculateRecommendationScoring(ratings, similarities) {
  let scores = ratings.map(a => ({...a})); // Deep copy of ratings
  let items = getKeys(ratings[0]).slice(1);
  let means = new Array(items.length).fill(0); 
  let sums = new Array(items.length).fill(0); 
  let score;
  for (let user in ratings) {
    for (let item in items) {
      sums[item] = sums[item] + parseInt(ratings[user][items[item]], 10);
    }
  }
  for (let item in items) {
    means[item] = sums[item] / ratings.length;
  }
  for (let user in ratings) {
    for (let item1 in items) {
      let sum1 = 0; let sum2 = 0;
      for (let item2 in items) {
        sum1 = sum1 + parseInt(similarities[items[item1]][items[item2]], 10) * parseInt(ratings[user][items[item2]], 10);
        sum2 = sum2 + parseInt(similarities[items[item1]][items[item2]], 10);
      }
      score = sum1 / sum2 + means[item1];
      scores[user][items[item1]] = score.toPrecision(3).toString();
    }
  }
  return scores;
}

server.get('/', (req, res) => FB.registerHook(req, res));

server.listen(PORT, () => console.log(`FBeamer Bot Service running on Port ${PORT}`));

server.post('/', bodyparser.json({ verify: FB.verifySignature.call(FB) }));

server.post('/', (req, res, data) => {
  return FB.incoming(req, res, data => {
    const userData = FB.messageHandler(data);

    if (!userInRatings(userData.sender, ratings)) {
      console.log('A new user speak with the bot');
      ratings.push({
        user_id: userData.sender,
        arts: '1',
        automobiles: '1',
        books: '1',
        business: '1',
        fashion: '1',
        food: '1',
        health: '1',
        home: '1',
        insider: '1',
        magazine: '1',
        movies: '1',
        nyregion: '1',
        obituaries: '1',
        opinion: '1',
        politics: '1',
        realestate: '1',
        science: '1',
        sports: '1',
        sundayreview: '1',
        technology: '1',
        theater: '1',
        travel: '1',
        upshot: '1',
        us: '1',
        world: '1'
      });
    }

    matcher(userData.content, cb => {

      switch (cb.intent) {
        case 'START':
          FB.sendMessageWithReplies("RESPONSE", userData.sender, "Hi! What do you want to know today?\n\nData provided by The New York Times", replies)
          previous_data = {
            "intent": "START"
          }
          break;

        case 'EXIT':
          FB.sendMessage("RESPONSE", userData.sender, "Thanks, see you later! 👋\n\nData provided by The New York Times")
          previous_data = {
            "intent": "EXIT"
          }
          break;

        case 'YES':
          if (previous_data.intent === "SEARCH") {
            FB.sendMessage("RESPONSE", userData.sender, "Glad to hear it 🤩")
            // The user is satisfied about the result, we consider it for the recommandation system
            let category = previous_data.data.section_name.toLowerCase().replace('.', '').replace('-', '');
            // Modify users ratings
            modifyRatings(userData.sender, ratings, category, 1)
            // Calculate categories similarity
            let similarities = calculateItemsSimilarities(ratings);
            // Calculate scores for each users
            let scores = calculateRecommendationScoring(ratings, similarities);
            // Save into csv ratings and scores
            writeCsv('./recommendation/ratings.csv', ratings);
            writeCsv('./recommendation/scores.csv', scores);
            previous_data = {
              "intent": "YES"
            }
          } else {
            FB.sendMessageWithReplies("RESPONSE", userData.sender, "Sorry, I didn't understand what you asked... 😔", replies)
          }
          break;

        case 'NO':
          if (previous_data.intent === "SEARCH") {
            FB.sendMessage("RESPONSE", userData.sender, "Sorry, I'll try to improve!")
            // The user is unsatisfied about the result, we consider it for the recommandation system
            let category = previous_data.data.section_name.toLowerCase().replace('.', '').replace('-', '');
            // Modify users ratings
            modifyRatings(userData.sender, ratings, category, 0)
            // Calculate categories similarity
            let similarities = calculateItemsSimilarities(ratings);
            // Calculate scores for each users
            let scores = calculateRecommendationScoring(ratings, similarities);
            // Save into csv ratings and scores
            writeCsv('./recommendation/ratings.csv', ratings);
            writeCsv('./recommendation/scores.csv', scores);
            previous_data = {
              "intent": "NO"
            }
          } else {
            FB.sendMessageWithReplies("RESPONSE", userData.sender, "Sorry, I didn't understand what you asked... 😔", replies)
          }
          break;

        case 'TOP':
          nyt(cb.intent, cb.entities, null).then(response => {
            FB.sendMessage("RESPONSE", userData.sender, response.text)
          })
          previous_data = {
            "intent": "TOP"
          }
          break;

        case 'POPULAR':
          nyt(cb.intent, cb.entities, null).then(response => {
            FB.sendMessage("RESPONSE", userData.sender, response.text)
          })
          previous_data = {
            "intent": "POPULAR"
          }
          break;

        case 'SEARCH':
          nyt(cb.intent, cb.entities, null).then(response => {
            FB.sendMessageWithReplies("RESPONSE", userData.sender, response.text, yes_no)
            previous_data = {
              "intent": "SEARCH",
              "data": response.data
            }
          })
          break;

        case 'CATEGORY':
          nyt(cb.intent, cb.entities, null).then(response => {
            FB.sendMessage("RESPONSE", userData.sender, response.text)
            previous_data = {
              "intent": "CATEGORY",
              "data": response.data
            }
            // Modify users ratings
            modifyRatings(userData.sender, ratings, cb.entities.groups.category, 1)
            // Calculate categories similarity
            let similarities = calculateItemsSimilarities(ratings);
            // Calculate scores for each users
            let scores = calculateRecommendationScoring(ratings, similarities);
            // Save into csv ratings and scores
            writeCsv('./recommendation/ratings.csv', ratings);
            writeCsv('./recommendation/scores.csv', scores);
          })
          break;

        case 'CUSTOMIZED':
          // Calculate categories similarity
          let similarities = calculateItemsSimilarities(ratings);
          // Calculate scores for each users
          let scores = calculateRecommendationScoring(ratings, similarities);
          let user_scores; // Let's find the scores of our user
          for (let i = 0; i < scores.length; i++) {
            if (scores[i]['user_id'] === userData.sender) {
              user_scores = scores[i];
            }
          }
          // Then we put them into an array
          let categories = [];
          for (var score in user_scores) {
            user_scores[score] = parseInt(user_scores[score], 10);
            categories.push([score, user_scores[score]]);
          }
          categories = categories.slice(1);
          // Finally, we sort the array
          categories.sort(function(a, b) {
            return a[1] - b[1];
          });
          console.log(categories);
          // For now, there is a little problem in nytimes/index.js for getting the good articles. So we just show the top 3 recommended categories of the user
          let text = "The best articles I can show you are dealing with " + categories.slice(-3)[0][0] + ", " + categories.slice(-3)[1][0] + " and " + categories.slice(-3)[2][0] + ".";
          FB.sendMessage("RESPONSE", userData.sender, text);
          nyt(cb.intent, cb.entities, categories.slice(-3)).then(response => {
            for (let i = 0; i < response.length; i++) {
              FB.sendMessage("RESPONSE", userData.sender, response.text[i])
            }
            previous_data = {
              "intent": "CUSTOMIZED",
              "data": null
            }
          })
          break;

        default:
          FB.sendMessageWithReplies("RESPONSE", userData.sender, "Sorry, I didn't understand what you asked... 😔", replies)
        }
    });
  });
});