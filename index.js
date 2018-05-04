const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const HOST = 'https://www.google.co.jp';
const URL = HOST + '/search?q=';
const range = 20;

var client = require('cheerio-httpcli');

client.set('followMetaRefresh', false);
client.set('headers', {
    'accept-language': 'ja-JP'
});
client.set('debug', true);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const header = [
    {id: 'title', title: 'title'},
    {id: 'link', title: 'link'}
];

var write_csv = function (records, csv_path) {

    var csvWriter = createCsvWriter({
        path: csv_path,
        header : header
    });

    csvWriter.writeRecords(records)       // returns a promise
    .then(() => {
        console.log('...Done');
    });
}

var app = express();

app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', function (req, host_res) {
        var contents = [];
        var pages = [];
        var start = 0;
        var limit = 2;
        var name = "";

        // NAMEパラメタが空でなければ画面に表示
        if (req.query.name) {
            name = req.query.name;
        }
        if (req.query.limit) {
            limit = Number(req.query.limit);
        }
        if (req.query.start) {
            start = Number(req.query.start);
        }
        var count = 0;
        var home_url = URL + name + '&oq=' + name + '&source=lnms&tbm=shop&sa=X&hl=ja&gl=jp&start=' + (start*range);
        var next_url = home_url;
        var csv_path = 'public/csv/data_' + name + '.csv';

        while (next_url && count < limit) {
            client.set("browser", 'chrome');
            var result = client.fetchSync(next_url);
            client.reset();
            if(!result.$){
                count == limit;
                break;
            }
            result.$(".eIuuYe").each(function (index, ele) {
                var title = ele.children[0].children[0].data;


                contents.push({title : title, link : HOST + ele.children[0].attribs.href});
            });

            next_url = result.$('#pnnext').attr('href') ? HOST + result.$('#pnnext').attr('href') : false;
            count++;
        }

        write_csv(contents, csv_path)

        host_res.render('pages/index', {contents : contents, home_url : home_url, name :name})

    }).listen(PORT, () => console.log(`Listening on ${ PORT }`))






