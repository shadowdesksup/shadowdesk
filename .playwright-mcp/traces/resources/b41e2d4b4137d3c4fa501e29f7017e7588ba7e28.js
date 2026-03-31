var app = angular.module('unespauth', ['ngMaterial', 'ngMessages', 'ngResource'])
.run(function($log){
	$log.debug('Inicializando Angular App Unespauth');
	
})
.config(function($mdThemingProvider){
	$mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('light-blue');
});