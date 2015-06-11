angular.module('starter.controllers', [])

.controller('Restaurantes', function($scope, $state, fireBaseData, $firebase, $ionicPopup) {

        $scope.dataAtual = function() {
            var dataAtual = new Date();

            var dia = dataAtual.getDate();
            var mes = dataAtual.getMonth() + 1;
            var ano = dataAtual.getFullYear();

            return dia + '-' + mes + "-" + ano;
        };

        $scope.dataAnterior = function() {
            var dataAtual = new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000));

            var dia = dataAtual.getDate();
            var mes = dataAtual.getMonth() + 1;
            var ano = dataAtual.getFullYear();

            return dia + '-' + mes + "-" + ano;
        };

        $scope.horaDepois1130 = function() {
            var dataAtual = new Date();

            var hora = dataAtual.getHours();
            var minutos = dataAtual.getMinutes();

            return hora >= 11 && minutos >= 30;
        };

        $scope.expensesHoje = new Firebase(fireBaseData.refExpenses().toString()+ $scope.dataAtual());
        $scope.votosHoje = new Firebase(fireBaseData.refRoomMates().toString()+ $scope.dataAtual());

        $scope.expenses = $firebase($scope.expensesHoje.orderByChild('cost')).$asArray();
        $scope.votos = $firebase($scope.votosHoje).$asArray();
        $scope.user = fireBaseData.ref().getAuth();
        $scope.showLoginForm = false;
        $scope.permissaoVotar = true;
        $scope.isEscolhido = false;
        $scope.isEmpate = false;
        $scope.isSemVoto = false;

        $scope.expenses.$loaded().then(
            function(data) {
                if(data.length <= 0) {
                    $firebase(new Firebase(fireBaseData.refExpenses().toString()+ $scope.dataAnterior())).$asArray().$loaded().then(
                        function(rest) {
                            rest.forEach(function(childSnapshot) {
                                $firebase($scope.expensesHoje).$asArray().$add({
                                    by: childSnapshot.by,
                                    label: childSnapshot.label,
                                    cost: 0
                                });
                            });
                            $scope.isSemVoto = true;
                        });
                }

                if($scope.expenses.length > 0 && data[0].cost === 0)
                {
                    $scope.isSemVoto = true;
                    return;
                }

                if($scope.expenses.length > 1 && data[0].cost === data[1].cost){
                    $scope.isEmpate = true;
                    return;
                }
            });

        //Checking if user is logged in
        if (!$scope.user) {
            $scope.showLoginForm = true;
        }

        $scope.verificarVoto = function() {
            if ($scope.user) {
                $scope.permissaoVotar = true;
                $scope.votosHoje.orderByChild('by').equalTo($scope.user.password.email).on("child_added", function (snapshot) {
                    $scope.permissaoVotar = false;
                    return true;
                });
            }

            if($scope.horaDepois1130()){
                $scope.isEscolhido = true;
                $scope.permissaoVotar = false;
                return true;
            }
        };

        $scope.verificarVoto();

        //ADD MESSAGE METHOD
        $scope.addRestaurante = function(e) {
          $scope.expenses.$add({
            by: $scope.user.password.email,
            label: $scope.label,
            cost: 0
          });
          $scope.label = "";
          $scope.cost = 0;
        };

        $scope.getTotal = function () {
            var i, rtnTotal = 0;
            for (i = 0; i < $scope.expenses.length; i = i + 1) {
                rtnTotal = rtnTotal + $scope.expenses[i].cost;
            }
            return rtnTotal;
        };

        $scope.onComplete = function(error) {
            if (error) {
                console.log('Synchronization failed');
            }
        };

        $scope.votar = function (expense) {

            if($scope.verificarVoto()){
                $scope.erroVoto();
                return;
            }

            var hopperRef = $scope.expensesHoje.child(expense.$id);

            hopperRef.once('value', function(nameSnapshot) {
                hopperRef.update({
                    cost: nameSnapshot.child('cost').val() - 1
                }, $scope.onComplete);

                $scope.votos.$add({
                    by: $scope.user.password.email,
                    voto: nameSnapshot.child('label').val()
                });

                $scope.showAlert();
            });
        };

        $scope.erroVoto = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'Voto n&atilde;o contabilizado, vota&ccedil;&atilde;o encerrada.'
            });
            alertPopup.then();
        };

        $scope.showAlert = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Sucesso!',
                template: 'Seu Voto est&aacute; sendo contabilizado...'
            });
            alertPopup.then();
        };

        $scope.showUsuarioExistente = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'A nova conta de usu&aacute;rio n&atilde;o pode ser criado porque o e-mail j&aacute; est&aacute; em uso...'
            });
            alertPopup.then();
        };

        $scope.showEmailInvaido = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'O e-mail especificado n&atilde;o &eacute; um e-mail v&aacute;lido...'
            });
            alertPopup.then();
        };

        $scope.showCamposObrigatorios = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'Os campos s&atilde;o obrigat&oacute;rios...'
            });
            alertPopup.then();
        };

        $scope.showInesperado = function() {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'Ocorreu um erro inesperado, favor entrar em contato com dono da aplica&ccedil;&atilde;o...'
            });
            alertPopup.then();
        };

        $scope.showLoginInvalido = function(em) {
            var alertPopup = $ionicPopup.alert({
                title: 'Erro!',
                template: 'Erro ao autenticar o usu&aacute;rio: ' + em
            });
            alertPopup.then();
        };

        //Login method
        $scope.login = function (em, pwd) {
            if(!em)
            {
                $scope.showCamposObrigatorios();
                return;
            }
            if(!pwd){
                $scope.showCamposObrigatorios();
                return;
            }

            fireBaseData.ref().authWithPassword({
                email    : em,
                password : pwd
            }, function(error, authData) {
                if (error === null) {
                    console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
                    $scope.user = fireBaseData.ref().getAuth();
                    $scope.showLoginForm = false;
                    $scope.verificarVoto();
                    $scope.$apply();
                } else {
                    console.log("Erro ao autenticar o usu&aacute;rio:", em);
                    $scope.showLoginInvalido(em);
                }
            });
        };

        //Login method
        $scope.criarConta = function (em, pwd) {

            if(!em)
            {
                $scope.showCamposObrigatorios();
                return;
            }
            if(!pwd){
                $scope.showCamposObrigatorios();
                return;
            }

            fireBaseData.ref().createUser({
                email: em,
                password: pwd
            }, function(error) {
                if (error) {
                    switch (error.code) {
                        case "EMAIL_TAKEN":
                            console.log("A nova conta de usu&aacute;rio n&atilde;o pode ser criado porque o e-mail j&aacute; est&aacute; em uso.");
                            $scope.showUsuarioExistente();
                            break;
                        case "INVALID_EMAIL":
                            console.log("O e-mail especificado n&atilde;o &eacute; um e-mail v&aacute;lido.");
                            $scope.showEmailInvaido();
                            break;
                        default:
                            console.log("Error creating user:", error);
                            $scope.showInesperado();
                    }
                } else {
                    console.log("Successfully created");
                    $scope.login(em, pwd);
                }
            });
        };

        //Logout method
        $scope.logout = function () {
            fireBaseData.ref().unauth();
            $scope.showLoginForm = true;
        };
})