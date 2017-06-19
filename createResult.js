var fs = require('fs');
const phantom = require('phantom');
var page;
phantom.create().then((instance, err) => {
    page = instance.createPage();
});

class ImageCreator {
    constructor(root) {
        this.root = root;

        this.createPersonalResult = this.createPersonalResult.bind(this);
    }

    createPersonalResult(result, fb) {
        var self = this;
        var path = getFileUrl('result.html');
        var personalResult = self.calculatePersonalResult(result.results, fb);
        var resultHTML = self.personalResultToHTML(personalResult, result);
        return page.then((p) => {
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

    createGlobalResults(results, fb) {
        var self = this;
        let numbers = [
            0,
            0,
            0
        ];
        for (let prop in results) {
            if (results[prop].status === 'abgeschlossen') {
                numbers[this.calculatePersonalResult(results[prop].results, fb).total - 1]++;
            }
        }
        return page.then((p) => {
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
                        content.innerHTML = '<canvas id="chart" width="100" height="100"></canvas>';
                        var myPieChart = new Chart(document.getElementById('chart').getContext('2d'), {
                            type: 'pie',
                            data: {
                                datasets: [{
                                    data: numbers,
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.2)',
                                        'rgba(54, 162, 235, 0.2)',
                                        'rgba(255, 206, 86, 0.2)'
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
                                }
                            }
                        });
                    }, numbers);
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

function getFileUrl(str) {
    var pathName = (__dirname + '/' + str).replace(/\\/g, '/');
    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== "/") {
        pathName = "/" + pathName;
    }
    return encodeURI("file://" + pathName);
};

function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}

module.exports = ImageCreator