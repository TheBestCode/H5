require.config({
	baseUrl: 'js/lib',
    urlArgs: "v="+Date.now(),
});

require(["jquery-1.11.0.js"],function($){
	console.log("success");
});
