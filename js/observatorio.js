var app = angular.module('observatorioApp', [], function($interpolateProvider) {
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

app.controller('NewsController', ["$scope", "$http", function ($scope, $http){
  // GET
  get_news_url = "//api.morph.io/ciudadanointeligente/observatorio-news-spreadsheet-storage/data.json?key=jWPkGMlm7hapMCPNySIt&query=select%20*%20from%20data&callback=JSON_CALLBACK";
  $scope.news = [];
  $scope.highlighted_news = [];

  $http.jsonp(get_news_url)
    .then( function (response){
      console.log(response);
      response.data.forEach( function( d ){
        d['date'] = moment(d['date'], "DMMYYYY").format('LL').toLowerCase();
        if (d['highlighted'] == 1) {
          $scope.highlighted_news.push( d );
        } else {
          $scope.news.push( d );
        }
      })
    }, function(response){
      console.log(response);
    });

}])