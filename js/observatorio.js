var app = angular.module('observatorioApp', ['ngSanitize'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

app.controller('PromissesController', ["$scope", "$http", function ($scope, $http){
  // GET
  get_cat_url = "//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20DISTINCT%20category%20from%20data&callback=JSON_CALLBACK";
  $scope.categories = [];
  $scope.promisses_by_categories = {};

  $http.jsonp(get_cat_url)
    .then( function (response){
      response.data.forEach( function( d ){
        $scope.categories.push( d.category );
        get_promisse_by_category( d.category );
      })
    }, function(response){
      console.log(response);
    });

  function get_promisse_by_category(cat) {
    $http.jsonp("//api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20'data'%20where%20category%20like%20'"+encodeURIComponent(cat)+"'&callback=JSON_CALLBACK")
      .then( function (response){
        $scope.promisses_by_categories[cat] = response.data;
      }, function(response){
        console.log(response);
      });
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
