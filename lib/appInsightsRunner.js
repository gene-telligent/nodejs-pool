"use strict";


let lastMinerStats = {};

function calculateMinerDeltas(miner) {
    let minerCache = global.database.getCache(miner);
    if (!lastMinerStats.hasOwnProperty(miner)) {
        lastMinerStats[miner] = {
            totalHashes : 0,
            goodShares: 0,
            badShares: 0
        };
    }

    delete minerCache.hashHistory;
    if (!minerCache.hasOwnProperty('goodShares')) {
        minerCache.goodShares = 0;
        minerCache.badShares = 0;
    }

    let lms = lastMinerStats[miner];

    let deltas = {
        totalHashes: minerCache.totalHashes - lms.totalHashes,
        goodShares: minerCache.goodShares - lms.goodShares,
        badShares: minerCache.badShares - lms.badShares
    };

    lastMinerStats[miner] = minerCache;

    return deltas;
}


setInterval(function(){
    console.log("Submitting metrics to appInsights");
    let globalStats = global.database.getCache('pool_stats_global');

    global.appInsights.trackMetric({name: "pool_hashrate", value: globalStats.hashRate});
    global.appInsights.trackMetric({name: "miner_count", value: globalStats.miners});

    let minerList = global.database.getCache('minerList');
    if (minerList) {
        minerList.forEach(function (miner) {
            let minerData = miner.split('_');
            if (minerData.length === 1) {
                return;
            }

            let metricProperties = {
                minerId: minerData[1],
                address: minerData[0]
            };

            let deltas = calculateMinerDeltas(miner);

            console.log(metricProperties);
            console.log(deltas);

            global.appInsights.trackMetric({name: "hashes", value:deltas.totalHashes, properties: metricProperties});
            global.appInsights.trackMetric({name: "goodShares", value:deltas.goodShares, properties: metricProperties});
            global.appInsights.trackMetric({name: "badShares", value:deltas.badShares, properties: metricProperties});
        });
    }

    console.log("Done submitting metrics to appInsights");
}, 30000);