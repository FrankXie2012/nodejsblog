$(document).ready(function() {
	function common_validate(obj, condition1) {
		if (condition1) {
			obj.attr('placeholder', obj.data('warning')).removeClass('okay');
			obj.parent().addClass('has-error');
		} else {
			obj.addClass('okay');
		}
	}

	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	$('.validate').focusout(function(){
		var id = $(this).attr('id');
		if (id == 'name' || id == 'title') {
			common_validate($(this), $(this).val()=='');
		} else if (id == 'password') {
			if ($(this).val().length < 6) {
				$(this).parent().after('<h3 style="margin: 3px" class="col-sm-2"><span class="label label-danger">密码长度应大于6位！</span></h3>');
				$(this).removeClass('okay');
			} else {
				$(this).addClass('okay');
			}
		} else if (id == 'repeat_psw') {
			var $password = $('#password').val();
			if ($(this).val() == $password) {
				$(this).addClass('okay');
			} else{
				$(this).parent().after('<h3 style="margin: 3px" class="col-sm-2"><span class="label label-danger">两次输入密码不一致！</span></h3>');
				$(this).removeClass('okay');
			}
		} else if (id == 'email') {
			if (!validateEmail($(this).val())) {
				$(this).parent().after('<h3 style="margin: 3px" class="col-sm-2"><span class="label label-danger">请输入有效邮箱！</span></h3>');
				$(this).removeClass('okay');
			} else {
				$(this).addClass('okay');
			}
		}
	});

	$('.validate').focus(function(){
		$(this).parent().removeClass('has-error');
		$(this).attr('placeholder', $(this).data('placeholder'));
	});

	$('#password, #email, #repeat_psw').focus(function() {
		$(this).parent().siblings('h3').hide();
	});

	$('input.validate').focusout(function() {
		flag = 'true';
		$('input.validate').each(function(){
			if (!$(this).hasClass('okay')) {
				flag = 'false';
			}
		});
		if (flag == 'true') {
			$('button.validate').removeClass('disabled');
			$('button.validate').removeAttr('disabled');
		}
	});

	$(function(){
		$('ul.navbar-nav li a').each(function(){
			if ($(this).attr('href') == window.location.pathname) {
				$(this).parent('li').addClass('active animated tada');
			}
		});
	});
});