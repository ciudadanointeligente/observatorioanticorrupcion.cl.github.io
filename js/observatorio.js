var app = angular.module('observatorioApp', ['ngSanitize'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

app.controller('MainController', ["$scope", "$http", "$timeout", function ($scope, $http, $timeout){
  get_total = "//api.morph.io/ciudadanointeligente/observatorio_totales/data.json?key=C317BJoPzKOOMj%2B83VbD&query=select%20*%20from%20%27data%27%20limit%2010&callback=JSON_CALLBACK"
  $http.jsonp(get_total)
    .then( function (response){
      response.data.forEach( function (d){
        new Chartist.Pie('.ct-chart-'+d.id, {
          labels: [d.total+"%"],
          series: [parseInt(d.total), (100-parseInt(d.total))]
        }, {
          donut: true,
          donutWidth: 15,
          startAngle: 0,
          showLabel: true,
          labelOffset: -85
        });
      })
    }, function (response){
      console.log(response);
    })
}]);

app.controller('PromissesController', ["$scope", "$http", "$timeout", function ($scope, $http, $timeout){
  // GET
  get_macroarea = "//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20macro_area%20from%20data%20order%20by%20macro_area&callback=JSON_CALLBACK";

  $http.jsonp(get_macroarea)
    .then(function (response){
      // console.log(response)
      $scope.macro_area = []
      $scope.promisses = {};
      $scope.promisses.items = [];
      var categories = {};
      response.data.forEach( function( d ){
        $scope.macro_area.push(d.macro_area)

        $scope.promisses.name = "Promisses"
        $scope.promisses.items.push( {"name": d.macro_area, "items": get_category_by_macro_category(d.macro_area)} );
      })
      fill_total();
    }, function(response){
      console.log(response);
    });

  function fill_total(){
    get_total = "//api.morph.io/ciudadanointeligente/observatorio_totales/data.json?key=C317BJoPzKOOMj%2B83VbD&query=select%20*%20from%20%27data%27%20limit%2010&callback=JSON_CALLBACK"
    $http.jsonp(get_total)
      .then( function (response){
        $scope.macro_total = []
        response.data.forEach( function (d){
          $scope.macro_total.push({'id': d.id, 'macro_area' : d.macro_area, 'total': d.total})
          var el = document.getElementById('macro-area-'+(parseInt(d.id)-1))
          el.innerHTML = d.total
        })
      }, function (response){
        console.log(response);
      })
  }

  function get_category_by_macro_category(macro) {
    get_cat_url = "//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20category%20from%20data%20where%20macro_area%20like%20'"+macro+"'&callback=JSON_CALLBACK";
    var categories = [];

    $http.jsonp(get_cat_url)
      .then( function (response){
        response.data.forEach( function( d ){
          var category = {};
              category.name = d.category;
              get_promisse_by_category(category);
          categories.push( category );
        })
      }, function(response){
        console.log(response);
      });
      return categories;
  }

  function get_promisse_by_category(category) {
    category.full = 0; category.advance = 0; category.progress = 0; category.total = 0; category.accomplished = 0;
    $http.jsonp("//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20'data'%20where%20category%20like%20'"+encodeURIComponent(category.name)+"'&callback=JSON_CALLBACK")
      .then( function (response){
        category.items = response.data;
        var cnt = 1;
        var new_fulfillment = 0;
        response.data.forEach( function (d){
          if ( d.fulfillment == '100%') {
            category.full = category.full+1;
          } else if ( d.fulfillment == '0%') {
            category.advance = category.advance+1;
          } else {
            category.progress = category.progress+1;
          }

          new_fulfillment = (parseInt(d.fulfillment.replace("%", "")) + new_fulfillment);

          category.accomplished = new_fulfillment;

          cnt++;
        })
      }, function(response){
        console.log(response);
      });
  }

  $timeout(function (){
    $('.showme-more').click( function() {
      if( $(this).siblings().attr('class') === 'hideme') {
        $('article.showme').removeClass('showme');
        $('p i').addClass('fa-arrow-down');
        $('p i').removeClass('fa-arrow-up');
        $('#fulfillment-'+$(this).data('id')+' article').removeClass('hideme');
        $('#fulfillment-'+$(this).data('id')+' article').addClass('showme');
        $('#fulfillment-'+$(this).data('id')+' p i').removeClass('fa-arrow-down');
        $('#fulfillment-'+$(this).data('id')+' p i').addClass('fa-arrow-up');
      } else {
        $('article.showme').removeClass('hideme');
        $('p i').addClass('fa-arrow-up');
        $('p i').removeClass('fa-arrow-dow');
        $('#fulfillment-'+$(this).data('id')+' article').removeClass('showme');
        $('#fulfillment-'+$(this).data('id')+' article').addClass('hideme');
        $('#fulfillment-'+$(this).data('id')+' p i').removeClass('fa-arrow-up');
        $('#fulfillment-'+$(this).data('id')+' p i').addClass('fa-arrow-down');
      }
    })
  },3000)
}])

app.controller('NewsController', ["$scope", "$http", "$sce", function ($scope, $http, $sce){
  // GET
  get_news_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.news = [];
  $scope.highlighted_news = [];

  $http.jsonp(get_news_url)
    .then( function (response){
      var contain_item = false;
      var contain_itemh = false;
      var gp = []
      var gph = []

      response.data.forEach( function( d ){
        d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
        d['summary'] = $sce.trustAsHtml(d['summary']);
        d['tags'] = JSON.parse(d['tags']);
        if (d['highlighted'] == 1) {
          // highlighteds news
          if ( !contain_itemh ) {
            gph.push( d );
            contain_itemh = true;
          } else {
            gph.push( d );
            $scope.highlighted_news.push( gph );
            gph = [];
            contain_itemh = false;
          }
        } else {
          // normal news
          if ( !contain_item ) {
            gp.push( d );
            contain_item = true;
          } else {
            gp.push( d );
            $scope.news.push( gp );
            gp = [];
            contain_item = false;
          }
        }
      })
      // if no more news, then close the news group
      if ( contain_itemh ) {
        // gph.push ( new Array() );
        $scope.highlighted_news.push( gph );
      }
      if ( contain_item ) {
        gp.push ( new Array() );
        $scope.news.push( gp );
      }
    }, function(response){
      console.log(response);
    });
}])

app.controller('NewsArchiveController', ["$scope", "$http", "$sce", function ($scope, $http, $sce){
  // GET
  get_news_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.news = [];

  get_tags_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20tags%20from%20data&callback=JSON_CALLBACK";
  $scope.tags_cat = [];

  $scope.filters = { };

  $http.jsonp(get_news_url)
    .then( function (response){
      response.data.forEach( function( d ){
        d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
        d['summary'] = $sce.trustAsHtml(d['summary']);
        d['source'] = "<a href='" + d['source'] + "'>" + d['source'] + "</a>";
        d['tags'] = JSON.parse(d['tags']);
        $scope.news.push( d );
      })
    }, function(response){
      console.log(response);
    });

  $http.jsonp(get_tags_url)
    .then( function (response){
      response.data.forEach( function( d ){
        JSON.parse(d['tags']).forEach( function( dt ){
          if ( $scope.tags_cat.indexOf(dt) < 0 ) {
            $scope.tags_cat.push( dt );
          }
        })
      })
    }, function(response){
      console.log(response);
    });
}])

app.controller('AgendaController', ["$scope", "$http", "$window", function ($scope, $http, $window){
  // GET
  get_agenda = "//api.morph.io/ciudadanointeligente/observatorio-agenda-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.months_with_events = [];
  $scope.filters = { };
  $scope.agenda = [];
  $window.agenda = [];

  $http.jsonp(get_agenda)
    .then(function (response){
      response.data.forEach( function( d ){
        if ( d['date'] != '' ) { // single date
          if ( $scope.months_with_events.indexOf( moment(d['date'], "DMMYYYY").format('MMMM') ) < 0 ) {
            $scope.months_with_events.push( moment(d['date'], "DMMYYYY").format('MMMM') );
          }
          d['cal_day'] = moment(d['date'], "DMMYYYY").format('YYYY-MM-DD');
          d['date_day'] = moment(d['date'], "DMMYYYY").format('DD');
          d['date_month'] = moment(d['date'], "DMMYYYY").format('MMM');
          d['date_month_long'] = moment(d['date'], "DMMYYYY").format('MMMM');
          d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
        } else {  // date range scenario
          if ( $scope.months_with_events.indexOf( moment(d['startDate'], "DMMYYYY").format('MMMM') ) < 0 ) {
            $scope.months_with_events.push( moment(d['startDate'], "DMMYYYY").format('MMMM') );
          } else if ( $scope.months_with_events.indexOf( moment(d['endDate'], "DMMYYYY").format('MMMM') ) < 0 ) {
            $scope.months_with_events.push( moment(d['endDate'], "DMMYYYY").format('MMMM') );
          }
          d['cal_startDate'] = moment(d['startDate'], "DMMYYYY").format('YYYY-MM-DD');
          d['cal_endDate'] = moment(d['endDate'], "DMMYYYY").format('YYYY-MM-DD');
          d['date_day'] = moment(d['startDate'], "DMMYYYY").format('DD');
          d['date_month'] = moment(d['startDate'], "DMMYYYY").format('MMM');
          d['startDate'] = moment(d['startDate'], "DMMYYYY").format('LL').toLowerCase();
          d['endDate'] = moment(d['endDate'], "DMMYYYY").format('LL').toLowerCase();
        }
        $scope.agenda.push( d );
      })
    }, function(response){
      console.log(response);
    });

  $window.agenda = $scope.agenda;
  var now = moment();
  $scope.current_month = now.format('MMMM');
  // $scope.current_year = now.format('YYYY');
}])
