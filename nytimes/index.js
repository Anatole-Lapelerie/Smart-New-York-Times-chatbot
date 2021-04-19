"use strict ";
const axios = require("axios");
const NYT_KEY = "2Ojv5sehipK4lQHbMf2Ps8rujv11FnOa";
let get = "";
let export_data = null;

const getApi = (intent, entities, more_data) => {
    return new Promise(async(resolve, reject) => {
        try {
            switch (intent) {
                case "TOP":
                    get = "https://api.nytimes.com/svc/topstories/v2/home.json?api-key=" + NYT_KEY;
                    const top_data = await axios.get(
                        get,
                    );
                    let top_text = "Here are the main news of the day:\n";
                    for (let i = 0; i < 6; i++) {
                        top_text = top_text + "• " + top_data.data.results[i].title + "\n";
                    }
                    top_text = top_text + "\nTell me if you want to know more about an article.";
                    export_data = null;
                    resolve({
                        "text": top_text,
                        "data": export_data
                    })
                    break;

                case "POPULAR":
                    if (entities.groups.range === undefined) {
                        entities.groups.range = 7;
                    }
                    if (entities.groups.criteria === 'popular') {
                        entities.groups.criteria = 'viewed';
                    }
                    get = "https://api.nytimes.com/svc/mostpopular/v2/" + entities.groups.criteria + "/" + entities.groups.range + ".json?api-key=" + NYT_KEY;
                    const popular_data = await axios.get(
                        get,
                    );
                    let popular_text = "Here are the more " + entities.groups.criteria + " articles of the last " + entities.groups.range + " days:\n";
                    for (let i = 0; i < 6; i++) {
                        popular_text = popular_text + "• " + popular_data.data.results[i].title + "\n";
                    }
                    popular_text = popular_text + "\nTell me if you want to know more about an article.";
                    export_data = null;
                    resolve({
                        "text": popular_text,
                        "data": export_data
                    })
                    break;

                case "SEARCH":
                    get = "https://api.nytimes.com/svc/search/v2/articlesearch.json?q=" + entities.groups.query.replace(' ', '+') + "&sort=newest&api-key=" + NYT_KEY;
                    const search_data = await axios.get(
                        get,
                    );
                    let search_text = "I have maybe something for you... Are you satisfied with this article?\n\n";
                    let title = search_data.data.response.docs[0].headline.print_headline;
                    if (title === null) {
                        title = search_data.data.response.docs[0].headline.main
                    }
                    search_text = search_text + title.toUpperCase() + "\n" + search_data.data.response.docs[0].byline.original + "\n\n" + search_data.data.response.docs[0].abstract + "\n\nRead more: " + search_data.data.response.docs[0].web_url;
                    export_data = search_data.data.response.docs[0];
                    resolve({
                        "text": search_text,
                        "data": export_data
                    })
                    break;

                case "CATEGORY":
                    if (entities.groups.category === "New York" || entities.groups.category === "NY") {
                        entities.groups.category = "nyregion";
                    }
                    if (entities.groups.category === "United States" || entities.groups.category === "US" || entities.groups.category === "USA") {
                        entities.groups.category = "us";
                    }
                    entities.groups.category.replace(' ', '');
                    get = "https://api.nytimes.com/svc/topstories/v2/" + entities.groups.category + ".json?api-key=" + NYT_KEY;
                    const category_data = await axios.get(
                        get,
                    );
                    let category_text = "Here are the main news of the day in the category " + entities.groups.category + ":\n";
                    for (let i = 0; i < 6; i++) {
                        category_text = category_text + "• " + category_data.data.results[i].title + "\n";
                    }
                    category_text = category_text + "\nTell me if you want to know more about an article.";
                    export_data = null;
                    resolve({
                        "text": category_text,
                        "data": export_data
                    })
                    break;

                case "CUSTOMIZED":
                    let messages = ["I prepared a personalized recap of the news for you! Enjoy 😉"];
                    let customized_data; let customized_text; let category;
                    for (let i = 0; i < 3; i++) {
                        category = '"' + more_data[i][0] + '"';
                        // !!! The request, working directly in browser, doesn't work with a get request, maybe because of the " transformed in %22
                        get = "https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=news_desk:(" + category + ")&api-key=" + NYT_KEY;
                        customized_data = await axios.get(
                            get,
                        );
                        console.log(customized_data);
                        title = customized_data.data.response.docs[i].headline.print_headline;
                        if (title === null) {
                            title = customized_data.data.response.docs[i].headline.main
                        }
                        customized_text = customized_text + title.toUpperCase() + "\n" + customized_data.data.response.docs[i].byline.original + "\n\n" + customized_data.data.response.docs[i].abstract + "\n\nRead more: " + customized_data.data.response.docs[i].web_url;
                        messages.push(customized_text);
                    }
                    export_data = null;
                    resolve({
                        "text": messages,
                        "data": export_data
                    })
                    break;
            }
        }

        catch (error) {
            reject(error);
        }

    });
    
}

module.exports = getApi;