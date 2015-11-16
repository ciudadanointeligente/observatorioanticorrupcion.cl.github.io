/*global module:false*/

var request = require('request');
var fs = require('fs');
var tabletop = require('tabletop');
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1QkkIRF-3Qrz-aRIxERbGbB7YHWz2-t4ix-7TEcuBNfE/pubhtml?gid=1823583981&single=true';



function functiontofindIndexByKeyValue(arraytosearch, key, valuetosearch) {
    for (var i = 0; i < arraytosearch.length; i++) {
 
        if (arraytosearch[i][key] == valuetosearch) {
        return i;
        }
    }
    return -1;
}

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    http: {
        get_macro_areas: {
          options: {
            url: 'https://api.morph.io/ciudadanointeligente/observatorio-spreadsheet-storage/data.json',
            form: {
              key: process.env.MORPH_KEY,
              query: "select distinct macro_area from 'data'"
            },
            callback: function(error, response){
                console.log("get_macro_areas");
                var macro_areas = []
                var data = JSON.parse(response.body)
                var data_string = JSON.stringify(data, null, 4);
                grunt.file.write("_data/macro_areas.json", data_string)
            }
          }
        },
        get_totales: {
            options:{
                url: "https://api.morph.io/ciudadanointeligente/observatorio_totales/data.json",
                form: {
                    key: process.env.MORPH_KEY,
                    query: "select * from 'data'"
                },
                callback: function(error, response){
                    var data = JSON.parse(response.body)
                    var totales_string = JSON.stringify(data, null, 4);
                    grunt.file.write("_data/totales.json", totales_string)
                }
            }
        }
      }
  });

  // These plugins provide necessary tasks.

  // Default task.
    grunt.loadNpmTasks('grunt-http');
    grunt.registerTask('UpdateData', 'Va a buscar las cosas a google docs y las deja en un json', function() {
        var done = this.async();
        function showInfo(data, tabletop){console.log(tabletop.models.promesas.elements)}

        var i = tabletop.init({key: public_spreadsheet_url, callback: function(data, tabletop){
            var all_promises = tabletop.models.promesas.elements;
            var totales = []

            /**
            Get Totales
            **/
            var totales_counter = 1;
            for (var i=0; i < all_promises.length; i++){
                if(functiontofindIndexByKeyValue(totales, "macro_area", all_promises[i].macro_area) == -1){

                    totales.push({
                        "id": totales_counter,
                        "macro_area": all_promises[i].macro_area,
                        "quality_macro_area": all_promises[i].quality_macro_area,
                        "fulfillment_macro_area": Number((all_promises[i].fulfillment_macro_area * 100).toFixed(1))
                    })
                    totales_counter++;
                }
                
            }
            grunt.file.write("_data/totales.json", JSON.stringify(totales, null, 4))

            /**
            Get Macro Areas
            **/

            var macro_areas = []
            var macro_areas_counter = 0;
            for (var i=0; i < all_promises.length; i++){
                if(functiontofindIndexByKeyValue(macro_areas, "macro_area", all_promises[i].macro_area) == -1){
                    macro_areas.push({
                        "id":macro_areas_counter,
                        "macro_area": all_promises[i].macro_area,
                        "quality_macro_area": all_promises[i].quality_macro_area,
                        "fulfillment_macro_area": Number((all_promises[i].fulfillment_macro_area * 100).toFixed(1))
                    })
                    macro_areas_counter++;
                }
            }
            var data_string = JSON.stringify(macro_areas, null, 4);
            grunt.file.write("_data/macro_areas.json", data_string)

            /**
            Get Categories and promises
            **/
            var macro_areas = []
            var data = all_promises
            var macro_categories = {};
            var data_categories = {};
            for(var i=0; i < data.length; i ++){
                var promise = data[i];
                if(Object.keys(macro_categories).indexOf(promise.macro_area) == -1){
                    macro_categories[promise.macro_area] = []
                }
                if(Object.keys(data_categories).indexOf(promise.category) == -1){
                    data_categories[promise.category] = []
                }
                if(functiontofindIndexByKeyValue(macro_categories[promise.macro_area], "category", promise.category) == -1){
                    macro_categories[promise.macro_area].push({"category": promise.category})
                }
                data_categories[promise.category].push(promise)

            }
            var data_categories_as_string = JSON.stringify(data_categories, null, 4);
            var data_string = JSON.stringify(macro_categories, null, 4);
            grunt.file.write("_data/categories_by_macro.json", data_string)
            grunt.file.write("_data/data_categories.json", data_categories_as_string)

            done()
        }
        , simpleSheet: true})

    });
};
