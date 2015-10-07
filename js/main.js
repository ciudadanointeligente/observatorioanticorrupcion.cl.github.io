(function ($) {
    "use strict";
    var fn = {

        // Launch Functions
        Launch: function () {
            fn.MenuSticky();
        },



        // Sticky Menu
        MenuSticky: function () {
            var menu = document.querySelector('#menu'),
                origOffsetY = menu.offsetTop + 100;
            function scroll() {
                if ($(window).scrollTop() >= origOffsetY) {
                    $('#menu').addClass('sticky');
                    $('#menu').removeClass('fixed');
                } else {
                    $('#menu').removeClass('sticky');
                    $('#menu').addClass('fixed');
                }
            }
            document.onscroll = scroll;
        }

    };

    $(document).ready(function () {
        fn.Launch();
    });

})(jQuery);