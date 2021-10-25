'use strict';
angular.module('HTTPDevicePlugin', ['uiAce'])
    .directive('httpDeviceSettings', function(){
    return {
        restrict: 'EA',
        scope: {
            plugin : '='
        },
        templateUrl: function(){
            let url = document.querySelector("script[src$='http-device-settings.js']");
            return url.src.replace('.js','.html');
        },
        controller: ['$scope', function($scope){

            // initialize variables
            $scope.selected_callback = "request";
            $scope.ui = {
                selectedDeviceType: "Default",
                deviceType: ""
            };

            function initSettings(type){
                $scope.settings.value[type] = {};
                $scope.settings.value[type].auto_provision_resources = false;
                $scope.settings.value[type].device_response_data = '""';
            }

            $scope.plugin.getProperty('settings').then(function(settings) {
                $scope.settings = settings;
            },function error(){
                $scope.settings = {};
                $scope.settings.value = {};
                initSettings('Default');
            });

            $scope.plugin.getToken('http_device_plugin_callback').then(function(token) {
                $scope.http_device_plugin_callback = token.access_token;
            },function error(){
                $scope.http_device_plugin_callback = 'Token not found!';
            });

            $scope.run_callback = function(callback, data){
                $scope.callback_result = "";
                $scope.plugin.post('/run_callback?fn=' + callback + '&deviceType=' + $scope.ui.selectedDeviceType, data).then(function(result) {
                    $scope.callback_result = JSON.stringify(result.data, null, 4);
                },function error(error){
                    showError(error);
                });
            };

            $scope.save = function(){
                $scope.save_state = 1;

                // save plugin settings
                $scope.plugin.setProperty('settings', $scope.settings).then(function(){

                    // send properties to plugin task so it does not require a reboot
                    $scope.plugin.put('/settings', $scope.settings.value).then(function(){
                        $scope.save_state = 2;
                    }, function (error) {
                        showError(error);
                    });

                },function(error){
                    showError(error);
                });
            };

            $scope.createDeviceType = function(deviceType){
                if(deviceType!==undefined && deviceType!==''){
                    initSettings(deviceType);
                    $scope.ui.selectedDeviceType = deviceType;
                }
            };

            $scope.removeDeviceType = function(deviceType){
                delete $scope.settings.value[deviceType];
                $scope.ui.selectedDeviceType = 'Default';
            };

            function showError(response){
                console.error(response);
                $scope.save_state = 3;
                $scope.error_code = response.status;
                if(response.status<=0){
                    $scope.error_message = "connection refused";
                }else if('data' in response && 'error' in response.data){
                    $scope.error_message = response.data.error.message;
                }else{
                    $scope.error_message = 'unknown';
                }
            }

        }]
    }
});