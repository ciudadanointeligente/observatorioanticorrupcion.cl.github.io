var app = angular.module('observatorioApp', ['ngSanitize'], function ($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});
var macro_areas = {{site.data.macro_areas | jsonify }}
var totales = {{site.data.totales | jsonify}}
var categories_by_macro = {{site.data.categories_by_macro | jsonify}}
var data_categories = {{site.data.data_categories | jsonify}}

function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

app.controller('MainController', ["$scope", "$http", "$timeout", "$filter", function ($scope, $http, $timeout, $filter) {
      totales.forEach(function (d) {

        var classname = '';
        if (d.fulfillment_macro_area == '') {
          d.fulfillment_macro_area = 0;
        }
        d.fulfillment_macro_area = $filter('number')(d.fulfillment_macro_area, 0)
        var label = [d.fulfillment_macro_area + "%"];
        if (d.mensaje) {
          label = [d.mensaje, 'lanzamiento'];
          classname = 'only-txt';
          $('.ct-chart-' + d.id).addClass(classname);
        }
        new Chartist.Pie('.ct-chart-' + d.id, {
          labels: label,
          series: [parseInt(d.fulfillment_macro_area), (100 - parseInt(d.fulfillment_macro_area))]
        }, {
          donut: true,
          donutWidth: 15,
          startAngle: 0,
          showLabel: true,
          labelOffset: -68
        }, [
          ['screen and (max-width: 1199px)', {
            labelOffset: -68
          }],
          ['screen and (max-width: 991px)', {
            labelOffset: -70
          }],
          ['screen and (max-width: 320px)', {
            labelOffset: -60
          }]
        ]);
        $('.note-' + d.id).text($filter('number')(d.quality_macro_area, 1))
      })
}]);

app.controller('PromissesController', ["$scope", "$http", "$timeout", "$filter", function ($scope, $http, $timeout, $filter) {
  $scope.macro_area = []
  $scope.promisses = {};
  $scope.promisses.items = [];
  var categories = {};
  macro_areas.forEach(function (d) {
    $scope.macro_area.push(d.macro_area)
    $scope.promisses.name = "Promisses"
    $scope.promisses.items.push({
      "name": d.macro_area,
      "id": slugify(d.macro_area),
      "fulfillment_macro_area": d.fulfillment_macro_area,
      "quality_macro_area": d.quality_macro_area,
      "items": get_category_by_macro_category(d.macro_area)
    });
  })
  fill_total();

  function fill_total() {
    $(function(){

      totales.forEach(function (d) {
        if ($('.ct-chart-' + d.id).length) {

          var classname = '';
          if (d.fulfillment_macro_area == '') {
            d.fulfillment_macro_area = 0;
          }
          d.fulfillment_macro_area = $filter('number')(d.fulfillment_macro_area, 0)
          var label = [d.fulfillment_macro_area + "%"];
          if (d.mensaje!='' && d.macro_area === $('.ct-chart-' + d.id + ' svg g:eq(2) text')) {
            label = [d.mensaje, 'lanzamiento'];
            classname = 'only-txt';
            $('.ct-chart-' + d.id).addClass(classname);
          }
          new Chartist.Pie('.ct-chart-' + d.id, {
            labels: label,
            series: [parseInt(d.fulfillment_macro_area), (100 - parseInt(d.fulfillment_macro_area))]
          }, {
            donut: true,
            donutWidth: 15,
            startAngle: 0,
            showLabel: true,
            labelOffset: -68
          }, [
            ['screen and (max-width: 980px)', {
              labelOffset: -75
            }]
          ]);        }
      })
    })
  }

  function get_category_by_macro_category(macro) {
    var categories = [];
    categories_by_macro[macro].forEach(function (d) {
      var category = {};
      category.name = d.category;
      category.id = slugify(d.category),
      get_promisse_by_category(category);
      categories.push(category);
    })
    return categories;
  }

  function get_promisse_by_category(category) {
    category.full = 0;
    category.advance = 0;
    category.progress = 0;
    category.total = 0;
    category.accomplished = 0;
    category.avg_progress = 0;
    category.avg_quality = 0;
    category.items = [];
    var cnt = 1;
    var new_fulfillment = 0;
    var ponderator = 0;
    data_categories[category.name].forEach(function (d) {
      if (d.fulfillment == '100%') {
        category.full = category.full + 1;
      } else if (d.fulfillment == '0%') {
        category.advance = category.advance + 1;
      } else {
        category.progress = category.progress + 1;
      }
      float_ponderator = parseFloat(d.ponderator.replace("%", ""))
      if (float_ponderator < 5) {
        d.importance = "color-low";
      }
      if (float_ponderator >= 5 && float_ponderator < 10) {
        d.importance = "color-medium";
      }
      if (float_ponderator >= 10) {
        d.importance = "color-high";
      }
      if(cnt == 1){
        category.accomplished = d.fulfillment_cat * 100;
        category.quality = d.quality_cat;
      }
      cnt++;
      category.items.push(d)
    })
  }

}])

app.controller('NewsController', ["$scope", "$http", "$sce", function ($scope, $http, $sce) {
  // GET
  get_news_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data%20order%20by%20(date)%20desc&callback=JSON_CALLBACK";
  $scope.news = [];
  $scope.highlighted_news = [];

  $http.jsonp(get_news_url)
    .then(function (response) {
      var contain_item = false;
      var contain_itemh = false;
      var gp = []
      var gph = []
      var is_already_highlighted = false;

      response.data.forEach(function (d) {
          var nd = d['date'];
          d['date'] = moment(d['date'], "YYYYDDMM").format('LL').toLowerCase();
          d['summary'] = $sce.trustAsHtml(d['summary']);
          d['tags'] = JSON.parse(d['tags']);

          var the_date = new Date( nd.slice(0,4) +'-'+ nd.slice(8,10) +'-'+ nd.slice(5,7) );
          d['unixtime'] = the_date.getTime();

          $scope.news.push(d);
        })
    }, function (response) {
      console.log(response);
    });

    get_tags_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20tags%20from%20data&callback=JSON_CALLBACK";
    $scope.tags_cat = [];

    $scope.filters = {};

    $http.jsonp(get_tags_url)
    .then(function (response) {
      response.data.forEach(function (d) {
        JSON.parse(d['tags']).forEach(function (dt) {
          if ($scope.tags_cat.indexOf(dt) < 0) {
            $scope.tags_cat.push(dt);
          }
        })
      })
    }, function (response) {
      console.log(response);
    });
}])

app.controller('AgendaController', ["$scope", "$http", "$window", function ($scope, $http, $window) {
  // GET
  get_agenda = "//api.morph.io/ciudadanointeligente/observatorio-agenda-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.agenda = [];
  $window.agenda = [];
  $scope.start_of_week = moment(new Date()).startOf('week');
  $scope.end_of_week = moment(new Date()).endOf('week');

  $http.jsonp(get_agenda)
    .then(function (response) {
      response.data.forEach(function (d) {
        if (d['date'] != '') { // single date
          d['cal_day'] = moment(d['date'], "DMMYYYY").format('YYYY-MM-DD');
          d['date_raw'] = moment(d['date'], "DMMYYYY");
          d['date_day'] = moment(d['date'], "DMMYYYY").format('DD');
          d['date_month'] = moment(d['date'], "DMMYYYY").format('MMM');
          d['month_txt'] = moment(d['date'], "DMMYYYY").format('MMMM');
          d['date_month_long'] = moment(d['date'], "DMMYYYY").format('MMMM');
          d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
          if (d['date_raw'] <= $scope.end_of_week && d['date_raw'] >= $scope.start_of_week) {
            d['current_week'] = true;
          } else {
            d['current_week'] = false;
          }
          $scope.agenda.push(d);
        } else { // date range case
          var ms = moment(d['endDate'], "DMMYYYY").diff(moment(d['startDate'], "DMMYYYY"));
          var tdays = Math.floor(moment.duration(ms).asDays());
          var i = 0;
          while (i <= tdays) {
            auxd = [];
            date = moment(d['startDate'], "DMMYYYY").add(i, 'days');
            auxd['date_day'] = date.format('DD');
            auxd['date_month'] = date.format('MMM');
            auxd['date'] = date;
            auxd['month_txt'] = moment(auxd['date'], "DMMYYYY").format('MMMM');
            auxd['cal_day'] = moment(auxd['date'], "DMMYYYY").format('YYYY-MM-DD');
            auxd['date_raw'] = auxd['date'];
            auxd['title'] = d['title'];
            auxd['summary'] = d['summary'];
            auxd['id'] = d['id'] + "_" + i;
            if (auxd['date_raw'] <= $scope.end_of_week && auxd['date_raw'] >= $scope.start_of_week) {
              auxd['current_week'] = true;
            } else {
              auxd['current_week'] = false;
            }
            $scope.agenda.push(auxd);
            i++;
          }
        }
      })
    }, function (response) {
      console.log(response);
    });
  $window.agenda = $scope.agenda;
  var now = moment();
  $scope.current_month = now.format('MMMM');
}])

app.controller('AgendaArchiveController', ["$scope", "$http", "$window", function ($scope, $http, $window) {
  // GET
  get_agenda = "//api.morph.io/ciudadanointeligente/observatorio-agenda-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.months_with_events = [];
  $scope.filters = {};
  $scope.agenda = [];
  $window.agenda = [];

  $http.jsonp(get_agenda)
    .then(function (response) {
      response.data.forEach(function (d) {
        if (d['date'] != '') { // single date
          if ($scope.months_with_events.indexOf(moment(d['date'], "DMMYYYY").format('MMMM')) < 0) {
            $scope.months_with_events.push(moment(d['date'], "DMMYYYY").format('MMMM'));
          }
          d['cal_day'] = moment(d['date'], "DMMYYYY").format('YYYY-MM-DD');
          d['date_day'] = moment(d['date'], "DMMYYYY").format('DD');
          d['date_month'] = moment(d['date'], "DMMYYYY").format('MMM');
          d['date_month_long'] = moment(d['date'], "DMMYYYY").format('MMMM');
          d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
        } else { // date range scenario
          if ($scope.months_with_events.indexOf(moment(d['startDate'], "DMMYYYY").format('MMMM')) < 0) {
            $scope.months_with_events.push(moment(d['startDate'], "DMMYYYY").format('MMMM'));
          } else if ($scope.months_with_events.indexOf(moment(d['endDate'], "DMMYYYY").format('MMMM')) < 0) {
            $scope.months_with_events.push(moment(d['endDate'], "DMMYYYY").format('MMMM'));
          }
          d['cal_startDate'] = moment(d['startDate'], "DMMYYYY").format('YYYY-MM-DD');
          d['cal_endDate'] = moment(d['endDate'], "DMMYYYY").format('YYYY-MM-DD');
          d['date_day'] = moment(d['startDate'], "DMMYYYY").format('DD');
          d['date_month'] = moment(d['startDate'], "DMMYYYY").format('MMM');
          d['startDate'] = moment(d['startDate'], "DMMYYYY").format('LL').toLowerCase();
          d['endDate'] = moment(d['endDate'], "DMMYYYY").format('LL').toLowerCase();
        }
        d['id'] = parseInt(d['id']);
        $scope.agenda.push(d);
      })
    }, function (response) {
      console.log(response);
    });

  $window.agenda = $scope.agenda;
  var now = moment();
  $scope.current_month = now.format('MMMM');
}])
