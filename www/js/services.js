angular.module('starter.services', [])
/**
 * A simple example service that returns some data.
 */
.factory('fireBaseData', function($firebase) {
  var ref = new Firebase("https://rafaelceciliano.firebaseio.com/"),
      refExpenses = new Firebase("https://rafaelceciliano.firebaseio.com/restaurante"),
      refRoomMates = new Firebase("https://rafaelceciliano.firebaseio.com/voto");
  return {
    ref: function () {
      return ref;
    },
    refExpenses: function () {
      return refExpenses;
    },
    refRoomMates: function () {
      return refRoomMates;
    }
  }
});