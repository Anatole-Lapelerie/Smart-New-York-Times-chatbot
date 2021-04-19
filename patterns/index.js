const patternDict = [
    {
        pattern: '\\b(Hi|Hello|Hey|Yo)\\b',
        intent: 'START'
    },
    {
        pattern: '\\b(bye|exit|quit)\\b',
        intent: 'EXIT'
    },
    {
        pattern: '\\b(yes|yep|true)\\b',
        intent: 'YES'
    },
    {
        pattern: '\\b(no|nope|false)\\b',
        intent: 'NO'
    },
    {
        pattern: '\\b(top|main|today|news)\\b',
        intent: 'TOP'
    },
    {
        pattern: '\\b(most|more|top)\\s(?<criteria>viewed|shared|emailed|popular)(\\sarticles\\s|\\s|)((of|during)\\sthe\\slast\\s(?<range>[1-9])|)',
        intent: "POPULAR",
        entities:
        {
            criteria: "viewed",
            range: "7"
        }
    },
    {
        pattern: '\\b(about|concerning|looking\\sfor)\\s\\b(?<query>(?<=(about|concerning|looking\\sfor)\\s)[\\s\\S]*\\b)',
        intent: 'SEARCH',
        entities:
        {
            query: "Castres"
        }
    },
    {
        pattern: '\\b(new|information|happened)(s|)\\s(in|on|in\\sthe|on\\s)\\s(?<category>arts|automobiles|books|business|fashion|food|health|home|insider|magazine|movies|New\\sYork|NY|obituaries|opinion|politics|real\\sestate|science|sports|sunday\\sreview|technology|theater|travel|upshot|United\\sStates|US|USA|world)(s|)\\b',
        intent: 'CATEGORY',
        entities:
        {
            category: "New York"
        }
    },
    {
        pattern: '\\b(learn\\sme|my\\s(recap|newspaper|newslist)|personal|personalized|custom|customized)\\b',
        intent: 'CUSTOMIZED'
    }
];

module.exports = patternDict;