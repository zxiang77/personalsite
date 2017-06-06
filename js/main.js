$(".page-header").mouseover(function () {
    $(this).css("border-color", "red");
});

$(".page-header").mouseout(function () {
    $(this).css("border-color", "#eee");
});

$("#topBox").css("height", "15px");

$("#spbio").click(function () {
    var obj = $("#bio");
    if (obj.hasClass("hidden")) {
        obj.removeClass("hidden");
    } else {
        obj.addClass("hidden");
    }
});

$("#spproj").click(function () {
    var obj = $("#proj");
    if (obj.hasClass("hidden")) {
        obj.removeClass("hidden");
    } else {
        obj.addClass("hidden");
    }
});

$("#spresume").click(function () {
    var obj = $("#resume");
    if (obj.hasClass("hidden")) {
        obj.removeClass("hidden");
    } else {
        obj.addClass("hidden");
    }
});
