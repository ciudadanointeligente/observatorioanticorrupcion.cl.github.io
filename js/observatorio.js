var app = angular.module('observatorioApp', ['ngSanitize'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

app.controller('PromissesController', ["$scope", "$http", function ($scope, $http){
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

    }, function(response){
      console.log(response);
    });

  function get_category_by_macro_category(macro) {
    get_cat_url = "//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20category%20from%20data%20where%20macro_area%20like%20'"+macro+"'&callback=JSON_CALLBACK";
    var categories = [];

    $http.jsonp(get_cat_url)
      .then( function (response){
        response.data.forEach( function( d ){
          var category = {};
              category.name = d.category;
              get_promisse_by_category(category);
              // category.items = get_promisse_by_category(category.name);
          categories.push( category );
        })
      }, function(response){
        console.log(response);
      });
      return categories;
  }

  function get_promisse_by_category(category) {
    $http.jsonp("//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20'data'%20where%20category%20like%20'"+encodeURIComponent(category.name)+"'&callback=JSON_CALLBACK")
      .then( function (response){
        category.items = response.data;
      }, function(response){
        console.log(response);
      });
      return category
  }
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
          if ( $scope.tags_cat.indexOf(dt) < 1 ) {
            $scope.tags_cat.push( dt );
          }
        })
      })
    }, function(response){
      console.log(response);
    });
}])
