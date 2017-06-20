var fs = require('fs');
const phantom = require('phantom');
var page;
phantom.create().then((instance, err) => {
    page = instance.createPage();
});

class ImageCreator {
    constructor() {
        // Binds the current context into the two major functions
        this.createPersonalResult = this.createPersonalResult.bind(this);
        this.createGlobalResults = this.createGlobalResults.bind(this);
    }

    // Generates an image of your personal result by using the passed results and survey using phantomjs
    createPersonalResult(result, fb) {
        var self = this;
        var path = getFileUrl('result.html');
        // Calculate the result which means the percent and category in which the current participant has fallen
        var personalResult = self.calculatePersonalResult(result.results, fb);
        // Generate the html for the personal result of the current participant by passing his result from above
        var resultHTML = self.personalResultToHTML(personalResult, result);
        return page.then((p) => {
            // Set the window size which will be the result image size
            p.property('viewportSize', {
                width: 800,
                height: 600
            });
            p.property('paperSize', {
                width: '800px',
                height: '600px',
                margin: '0px'
            });
            p.property('zoomFactor', 1);
            return p.open(getFileUrl('result.html')).then((status) => {
                if (status === "success") {
                    var render = evaluate(p, function (resultHTML) {
                        var content = document.getElementById('content');
                        content.innerHTML = resultHTML;
                    }, resultHTML);
                    // Return the rendered website as base64 image
                    return render.then(() => {
                        var myBase64Result = p.renderBase64('PNG');
                        return myBase64Result;
                    });
                } else {
                    phantom.exit(1);
                }
            });
        })
    }

    // Generates an image of the global results by using the passed results and survey using phantomjs
    createGlobalResults(results, fb) {
        var self = this;
        let numbers = [
            0,
            0,
            0
        ];
        // Calculate the number of participants of the survey who finished there survey and fell into the 3 categories
        for (let prop in results) {
            if (results[prop].status === 'abgeschlossen') {
                numbers[this.calculatePersonalResult(results[prop].results, fb).total - 1]++;
            }
        }
        return page.then((p) => {
            // Set the window size which will be the result image size
            p.property('viewportSize', {
                width: 800,
                height: 600
            });
            p.property('paperSize', {
                width: '800px',
                height: '600px',
                margin: '0px'
            });
            p.property('zoomFactor', 1);
            var path = getFileUrl('globalResult.html');
            return p.open(getFileUrl('globalResult.html')).then((status) => {
                if (status === "success") {
                    var render = evaluate(p, function (numbers) {
                        var content = document.getElementById('content');
                        content.innerHTML = '<h2 class="headline">Die Ergebnisse</h2><canvas id="chart" width="500" height="400"></canvas>';
                        // Use the results to draw an simple pie chart using chart.js and Chart.PieceLabel
                        var myPieChart = new Chart(document.getElementById('chart').getContext('2d'), {
                            type: 'pie',
                            data: {
                                datasets: [{
                                    data: numbers,
                                    backgroundColor: [
                                        'rgba(232, 103, 107, 1)',
                                        'rgba(61, 68, 81, 1)',
                                        'rgba(6, 144, 250, 1)'
                                    ],
                                }],
                                labels: [
                                    'Backendeveloper',
                                    'Frontenddeveloper',
                                    'Fullstackdeveloper'
                                ]
                            },
                            options: {
                                animation: {
                                    duration: 0
                                },
                                responsive: false,
                                pieceLabel: {
                                    mode: 'percentage',
                                    precision: 2,
                                    fontSize: 18,
                                    fontStyle: 'bold'
                                }
                            }
                        });
                    }, numbers);
                    // Return the rendered website as base64 image
                    return render.then(() => {
                        var myBase64Result = p.renderBase64('PNG');
                        return myBase64Result;
                    });
                } else {
                    phantom.exit(1);
                }
            });
        })

    }

    // Calculates category in which the current participant has fallen and how much he is fitting this position
    calculatePersonalResult(result, fb) {
        let mw = 0;
        let max = 0;
        for (let prop in fb) {
            switch (fb[prop].type) {
                case 'rating':
                    max += fb[prop].skala.max / 2;
                    if (result[fb[prop].id].wert <= fb[prop].skala.max / 2) {
                        mw += -(fb[prop].skala.max / 2 - (result[fb[prop].id].wert - 1));
                    } else {
                        mw += (result[fb[prop].id].wert - fb[prop].skala.max / 2);
                    }
                    break;
                case 'multi':
                    switch (fb[prop].action.type) {
                        case 'one':
                            max++;
                            mw += result[fb[prop].id].wert;
                            break;
                        case 'two':
                            max++;
                            if (result[fb[prop].id].wert.ergebnis > 0) {
                                mw--;
                            }
                            if (result[fb[prop].id].wert.ergebnis < 0) {
                                mw++;
                            }
                            break;
                    }
                    break;
            }
        }
        if (mw > 0) {
            return {
                total: 2,
                percent: (mw / max * 100).toFixed(0)
            };
        }
        if (mw < 0) {
            return {
                total: 1,
                percent: Math.abs((mw / max * 100)).toFixed(0)
            };
        }
        return {
            total: 3,
            percent: 100
        };
    }

    // Generates from the result of calculatePersonalResult the html needed to render and take the pic for the user
    personalResultToHTML(calculatedResult, profile) {
        var headline = '<div><h2 class="headline">Dein Ergebnis</h2>';
        var name = '';
        if (typeof profile.name !== typeof undefined) {
            name = '<h2>' + profile.name + '</h2><br>';
        }
        var image = '';
        if (typeof profile.profile_pic !== typeof undefined) {
            image = '<img src="' + profile.profile_pic.data + '">';
        }
        var progress = '<div class="progressContainer"><span class="progress" style="width:' + calculatedResult.percent + '%;">' + calculatedResult.percent + '%</span></div>';
        var resultText;
        if (typeof profile.profile_pic !== typeof undefined) {
            resultText = '<h1 class="result">Du bist mit einer Wahrscheinlichkeit von ...</h1>';
        } else {
            resultText = '<h1 class="result noImage">Du bist mit einer Wahrscheinlichkeit von ...</h1>';
        }
        var solution = '<h1 class="result">am besten geeignet für den Job als<br>'
        if (calculatedResult.total === 1) {
            solution += 'Backend Developer';
        }
        if (calculatedResult.total === 2) {
            solution += 'Frontend Developer';
        }
        if (calculatedResult.total === 3) {
            solution += '... Full-Stack Developer. Kannst dich wohl nicht entscheiden ;)';
        }
        solution += '</h1>';
        var splitter = '<h3 class="splitter">... zu ...</h3>';
        return headline + name + image + resultText + progress + solution + '</div>';
    }
}

// Uses the current path to build the absolute path to the needed file
function getFileUrl(str) {
    var pathName = (__dirname + '/' + str).replace(/\\/g, '/');
    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== "/") {
        pathName = "/" + pathName;
    }
    return encodeURI("file://" + pathName);
};

// Encapsulates the passed functions and adds alls arguments after the second one into the evalute function
function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}

module.exports = ImageCreator